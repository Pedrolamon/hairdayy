import { Router, Request, Response } from 'express';
import webpush from 'web-push';
import prisma from '../prisma'; 
import { authenticateJWT } from '../middleware/auth';
import { PrismaClient } from '@prisma/client'; 
import cron from 'node-cron';

const pushSubscriptions: { [userId: string]: any } = {};

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (!vapidPublicKey || !vapidPrivateKey) {
  console.error('VAPID keys not found. Please set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in your .env file.');
} else {
  webpush.setVapidDetails(
    'mailto:admin@hairday.com',
    vapidPublicKey,
    vapidPrivateKey
  );
}

// Salvar notificação enviada
async function saveNotification(userId: string, title: string, body: string) {
  await prisma.notification.create({
    data: {
      userId,
      title,
      body,
    },
  });
}

const router = Router();

// Registrar endpoint de push
router.post('/register', authenticateJWT, (req: Request & { userId?: string }, res: Response) => {
  const { subscription } = req.body;
  if (!subscription || !req.userId) return res.status(400).json({ error: 'Dados inválidos' });
  pushSubscriptions[req.userId] = subscription;
  res.json({ success: true });
});

// Enviar notificação push
router.post('/send', authenticateJWT, async (req: Request & { userId?: string }, res: Response) => {
  const { userId, title, body } = req.body;
  if (!userId || !pushSubscriptions[userId]) return res.status(400).json({ error: 'Usuário não registrado para push' });
  try {
    await webpush.sendNotification(
      pushSubscriptions[userId],
      JSON.stringify({ title: title || 'Notificação Hairday', body: body || 'Você tem uma nova notificação.' })
    );
    await saveNotification(userId, title || 'Notificação Hairday', body || 'Você tem uma nova notificação.');
    res.json({ success: true });
  } catch (err) {
      const errorMessage = (err instanceof Error) ? err.message : 'Erro desconhecido';
      res.status(500).json({ error: 'Erro ao enviar notificação', details: errorMessage });
  }
});

//obter a chave pública VAPID
router.get('/vapid-public-key', (_req, res) => {
  if (!vapidPublicKey) {
    return res.status(500).json({ error: 'Chave pública VAPID não configurada.' });
  }
  res.send(vapidPublicKey);
});

// listar notificações do usuário
router.get('/history', authenticateJWT, async (req: Request & { userId?: string }, res: Response) => {
  if (!req.userId) return res.status(401).json({ error: 'Não autenticado' });
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.userId },
      orderBy: { date: 'desc' },
    });
    res.json(notifications);
  } catch (error: unknown) {
    res.status(500).json({ error: 'Erro ao obter histórico de notificações.' });
  }
});

//marcar notificação como lida
router.put('/history/:id/read', authenticateJWT, async (req: Request & { userId?: string }, res: Response) => {
  if (!req.userId) return res.status(401).json({ error: 'Não autenticado' });
  const { id } = req.params;
  try {
    const notification = await prisma.notification.update({
      where: { id, userId: req.userId },
      data: { read: true },
    });
    res.json({ success: true, notification });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return res.status(404).json({ error: 'Notificação não encontrada' });
    }
    res.status(500).json({ error: 'Erro ao marcar notificação como lida.' });
  }
});

//excluir notificação
router.delete('/history/:id', authenticateJWT, async (req: Request & { userId?: string }, res: Response) => {
  if (!req.userId) return res.status(401).json({ error: 'Não autenticado' });
  const { id } = req.params;
  try {
    await prisma.notification.delete({
      where: { id, userId: req.userId },
    });
    res.json({ success: true });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return res.status(404).json({ error: 'Notificação não encontrada' });
    }
    res.status(500).json({ error: 'Erro ao excluir notificação.' });
  }
});

// marca todas como lidas
router.put('/history/mark-all-read', authenticateJWT, async (req: Request & { userId?: string }, res: Response) => {
  if (!req.userId) return res.status(401).json({ error: 'Não autenticado' });
  try {
    await prisma.notification.updateMany({
      where: { userId: req.userId, read: false },
      data: { read: true },
    });
    res.json({ success: true });
  } catch (error: unknown) {
    res.status(500).json({ error: 'Erro ao marcar todas as notificações como lidas.' });
  }
});

// excluir todas as notificações
router.delete('/history/delete-all', authenticateJWT, async (req: Request & { userId?: string }, res: Response) => {
  if (!req.userId) return res.status(401).json({ error: 'Não autenticado' });
  try {
    await prisma.notification.deleteMany({
      where: { userId: req.userId },
    });
    res.json({ success: true });
  } catch (error: unknown) {
    res.status(500).json({ error: 'Erro ao excluir todas as notificações.' });
  }
});


// ------------------------------------------------------------------------------------------------------------------------------------------------------------------

// Lógica de agendamento integrada
cron.schedule('*/1 * * * *', async () => {
    console.log('Verificando novos agendamentos...');
    try {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        
        const newAppointments = await prisma.appointment.findMany({
            where: {
                createdAt: {
                    gte: fiveMinutesAgo,
                },
            },
            include: {
                barber: true
            }
        });

        if (newAppointments.length > 0) {
            console.log(`Encontrado ${newAppointments.length} novo(s) agendamento(s).`);

            for (const appointment of newAppointments) {
                const barberId = appointment.barberId;
                const barberSubscription = pushSubscriptions[barberId];

                if (barberSubscription) {
                    const title = 'Novo Agendamento!';
                    const body = `O cliente ${appointment.clientName || 'anônimo'} agendou um serviço para ${appointment.date.toLocaleDateString('pt-BR')}.`;

                    await webpush.sendNotification(
                        barberSubscription,
                        JSON.stringify({ title, body })
                    );

                    await saveNotification(barberId, title, body);
                    console.log(`Notificação enviada para o barbeiro ${barberId}.`);
                }
            }
        }
    } catch (error) {
        console.error('Erro na tarefa agendada de verificação:', error);
    }
});

export { pushSubscriptions };
export default router;