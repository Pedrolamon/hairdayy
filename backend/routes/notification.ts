import { Router, Request, Response } from 'express';
import webpush from 'web-push';
import prisma from '../prisma';
import { authenticateJWT } from '../middleware/auth';
import cron from 'node-cron';
import {
  sendAppointmentReminders,
  checkPendingPayments,
  checkLowStock,
  cleanupOldNotifications,
} from '../jobs/appointmentReminderJob';

const pushSubscriptions: { [userId: string]: any } = {};

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (!vapidPublicKey || !vapidPrivateKey) {
  console.error('VAPID keys not found. Please set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in your .env file.');
} else {
  webpush.setVapidDetails('mailto:admin@hairday.com', vapidPublicKey, vapidPrivateKey);
}

async function saveNotification(userId: string, title: string, body: string) {
  return await prisma.notification.create({
    data: {
      userId,
      title,
      body,
    },
  });
}

const router = Router();

// Registrar subscription
router.post(
  '/register',
  authenticateJWT,
  async (req: Request & { userId?: string }, res: Response) => {
    const { subscription } = req.body;
    if (!subscription || !req.userId)
      return res.status(400).json({ error: 'Dados inválidos' });

    try {
      const saved = await prisma.pushSubscription.upsert({
        where: { userId: req.userId },
        update: { subscription },
        create: { userId: req.userId, subscription },
      });

      res.json({ success: true, subscription: saved });
    } catch (err) {
      console.error('Erro ao salvar subscription:', err);
      res.status(500).json({ error: 'Erro ao salvar subscription' });
    }
  }
);


// Enviar notificação push
// Enviar notificação push
router.post('/send', authenticateJWT, async (req: Request, res: Response) => {
  const { userId, title, body } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'Usuário não informado' });
  }

  try {
    const subscriptionRecord = await prisma.pushSubscription.findUnique({
      where: { userId },
    });

    if (!subscriptionRecord) {
      return res.status(400).json({ error: 'Usuário não registrado para push' });
    }

    await webpush.sendNotification(
      subscriptionRecord.subscription as unknown as webpush.PushSubscription,
      JSON.stringify({
        title: title || 'Notificação Hairday',
        body: body || 'Você tem uma nova notificação.',
      })
    );

    const notification = await saveNotification(
      userId,
      title || 'Notificação Hairday',
      body || 'Você tem uma nova notificação.'
    );

    res.json({ success: true, notification });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('Erro ao enviar notificação:', errorMessage);
    res.status(500).json({ error: 'Erro ao enviar notificação', details: errorMessage });
  }
});


// VAPID key pública
router.get('/vapid-public-key', (_req, res) => {
  if (!vapidPublicKey) return res.status(500).json({ error: 'Chave pública VAPID não configurada.' });
  res.send(vapidPublicKey);
});

// Histórico do usuário
router.get('/history', authenticateJWT, async (req: Request & { userId?: string }, res: Response) => {
  if (!req.userId) return res.status(401).json({ error: 'Não autenticado' });
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.userId },
      orderBy: { date: 'desc' },
    });
    res.json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter histórico de notificações.' });
  }
});

// Marcar como lida
router.put('/history/:id/read', authenticateJWT, async (req: Request & { userId?: string }, res: Response) => {
  if (!req.userId) return res.status(401).json({ error: 'Não autenticado' });
  const { id } = req.params;
  try {
    const notification = await prisma.notification.update({
      where: { id: String(id) },
      data: { read: true },
    });
    res.json({ success: true, notification });
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Notificação não encontrada' });
    res.status(500).json({ error: 'Erro ao marcar notificação como lida.' });
  }
});

// Excluir notificação
router.delete('/history/:id', authenticateJWT, async (req: Request & { userId?: string }, res: Response) => {
  if (!req.userId) return res.status(401).json({ error: 'Não autenticado' });
  const { id } = req.params;
  try {
    await prisma.notification.delete({ where: { id } });
    res.json({ success: true });
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Notificação não encontrada' });
    res.status(500).json({ error: 'Erro ao excluir notificação.' });
  }
});

// Marcar todas como lidas
router.put('/history/mark-all-read', authenticateJWT, async (req: Request & { userId?: string }, res: Response) => {
  if (!req.userId) return res.status(401).json({ error: 'Não autenticado' });
  try {
    await prisma.notification.updateMany({
      where: { userId: req.userId, read: false },
      data: { read: true },
    });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Erro ao marcar todas como lidas.' });
  }
});

// Excluir todas
router.delete('/history/delete-all', authenticateJWT, async (req: Request & { userId?: string }, res: Response) => {
  if (!req.userId) return res.status(401).json({ error: 'Não autenticado' });
  try {
    await prisma.notification.deleteMany({ where: { userId: req.userId } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Erro ao excluir todas as notificações.' });
  }
});

// Broadcast (apenas admin)
router.post('/broadcast', authenticateJWT, async (req: Request & { userId?: string }, res: Response) => {
  if (!req.userId) return res.status(401).json({ error: 'Não autenticado' });

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true },
    });

    if (!user || user.role !== 'ADMIN') return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });

    const { title, body, targetRole } = req.body;
    if (!title || !body) return res.status(400).json({ error: 'Título e corpo são obrigatórios.' });

    let users = await prisma.user.findMany({
      where: targetRole ? { role: targetRole as any } : {},
      select: { id: true },
    });

    const promises = users.map((u) => saveNotification(u.id, title, body));
    await Promise.all(promises);

    res.json({ success: true, message: `Notificação enviada para ${users.length} usuários.` });
  } catch (error) {
    console.error('Erro ao enviar notificação em massa:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// ---------------- CRONS ----------------
cron.schedule('*/1 * * * *', async () => {
  console.log('Verificando novos agendamentos...');
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const newAppointments = await prisma.appointment.findMany({
      where: { createdAt: { gte: fiveMinutesAgo } },
      include: { barber: true }, // Mantenha o include para ter acesso ao userId do barbeiro
    });
    console.log(`Encontrados ${newAppointments.length} novos agendamentos.`);

    for (const appointment of newAppointments) {
      // 💡 MUDANÇA AQUI: Obtém o userId a partir do barbeiro relacionado
      const barberUserId = appointment.barber.userId;
      
      // Usa o barberUserId para buscar a subscription
      const barberSubscriptionRecord = await prisma.pushSubscription.findUnique({
        where: { userId: barberUserId },
      });

      const barberSubscription = barberSubscriptionRecord?.subscription;

      if (barberSubscription) {
        console.log(`✅ Subscription encontrada para o barbeiro ${barberUserId}`);
        const title = 'Novo Agendamento!';
        const body = `O cliente ${appointment.clientName || 'anônimo'} agendou um serviço para ${appointment.date.toLocaleDateString('pt-BR')}.`;

       await webpush.sendNotification(
          barberSubscription as unknown as webpush.PushSubscription,
          JSON.stringify({ title, body })
        );
        
        await saveNotification(barberUserId, title, body);
        console.log(`Notificação enviada para o barbeiro ${barberUserId}`);
      } else {
        console.log(`❌ Subscription NÃO encontrada para o barbeiro ${barberUserId}`);
      }
    }
  } catch (error) {
    console.error('Erro na verificação de agendamentos:', error);
  }
});

cron.schedule('0 * * * *', async () => {
  try {
    await sendAppointmentReminders();
  } catch (error) {
    console.error('Erro ao enviar lembretes:', error);
  }
});

cron.schedule('0 9 * * *', async () => {
  try {
    await checkPendingPayments();
  } catch (error) {
    console.error('Erro ao verificar pagamentos:', error);
  }
});

cron.schedule('0 10 * * *', async () => {
  try {
    await checkLowStock();
  } catch (error) {
    console.error('Erro ao verificar estoque baixo:', error);
  }
});

cron.schedule('0 2 * * 0', async () => {
  try {
    await cleanupOldNotifications();
  } catch (error) {
    console.error('Erro ao limpar notificações antigas:', error);
  }
});

export { pushSubscriptions };
export default router;
