import { Router, Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { authenticateJWT } from '../middleware/auth';
import webpush from 'web-push';
import { Notification as NotificationEntity } from '../entity/Notification';

// Simples armazenamento em memória (substitua por banco em produção)
const pushSubscriptions: { [userId: number]: any } = {};

// Chaves VAPID de exemplo (gere suas próprias em produção)
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

// Verifique se as chaves existem antes de definir
if (!vapidPublicKey || !vapidPrivateKey) {
  console.error('VAPID keys not found. Please set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in your .env file.');
  // Em um ambiente de produção, você pode considerar interromper o servidor
  // throw new Error('VAPID keys not configured. Exiting.');
} else {
  webpush.setVapidDetails(
    'mailto:admin@hairday.com',
    vapidPublicKey,
    vapidPrivateKey
  );
}

// Salvar notificação enviada
async function saveNotification(userId: number, title: string, body: string) {
  const repo = AppDataSource.getRepository(NotificationEntity);
  const notification = repo.create({ userId, title, body });
  await repo.save(notification);
}

const router = Router();

// Registrar endpoint de push
router.post('/register', authenticateJWT, (req: Request & { userId?: number }, res: Response) => {
  const { subscription } = req.body;
  if (!subscription || !req.userId) return res.status(400).json({ error: 'Dados inválidos' });
  pushSubscriptions[req.userId] = subscription;
  res.json({ success: true });
});

// Enviar notificação push
router.post('/send', authenticateJWT, async (req: Request & { userId?: number }, res: Response) => {
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
    res.status(500).json({ error: 'Erro ao enviar notificação', details: err });
  }
});

// Endpoint para obter a chave pública VAPID
router.get('/vapid-public-key', (req, res) => {
  if (!vapidPublicKey) {
    return res.status(500).json({ error: 'Chave pública VAPID não configurada.' });
  }
  res.send(vapidPublicKey);
});

// Endpoint para listar notificações do usuário
router.get('/history', authenticateJWT, async (req: Request & { userId?: number }, res: Response) => {
  if (!req.userId) return res.status(401).json({ error: 'Não autenticado' });
  const repo = AppDataSource.getRepository(NotificationEntity);
  const notifications = await repo.find({ where: { userId: req.userId }, order: { date: 'DESC' } });
  res.json(notifications);
});
// Endpoint para marcar notificação como lida
router.put('/history/:id/read', authenticateJWT, async (req: Request & { userId?: number }, res: Response) => {
  if (!req.userId) return res.status(401).json({ error: 'Não autenticado' });
  const repo = AppDataSource.getRepository(NotificationEntity);
  const notification = await repo.findOneBy({ id: Number(req.params.id), userId: req.userId });
  if (!notification) return res.status(404).json({ error: 'Notificação não encontrada' });
  notification.read = true;
  await repo.save(notification);
  res.json({ success: true });
});

// Endpoint para excluir notificação
router.delete('/history/:id', authenticateJWT, async (req: Request & { userId?: number }, res: Response) => {
  if (!req.userId) return res.status(401).json({ error: 'Não autenticado' });
  const repo = AppDataSource.getRepository(NotificationEntity);
  const notification = await repo.findOneBy({ id: Number(req.params.id), userId: req.userId });
  if (!notification) return res.status(404).json({ error: 'Notificação não encontrada' });
  await repo.remove(notification);
  res.json({ success: true });
});

// Endpoint para marcar todas como lidas
router.put('/history/mark-all-read', authenticateJWT, async (req: Request & { userId?: number }, res: Response) => {
  if (!req.userId) return res.status(401).json({ error: 'Não autenticado' });
  const repo = AppDataSource.getRepository(NotificationEntity);
  await repo.update({ userId: req.userId, read: false }, { read: true });
  res.json({ success: true });
});
// Endpoint para excluir todas as notificações
router.delete('/history/delete-all', authenticateJWT, async (req: Request & { userId?: number }, res: Response) => {
  if (!req.userId) return res.status(401).json({ error: 'Não autenticado' });
  const repo = AppDataSource.getRepository(NotificationEntity);
  await repo.delete({ userId: req.userId });
  res.json({ success: true });
});

export { pushSubscriptions };
export default router; 