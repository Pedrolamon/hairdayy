import { PrismaClient } from '@prisma/client';
import webpush from 'web-push';
import { pushSubscriptions } from '../routes/notification';

const prisma = new PrismaClient();

// Tipos de notificação
export enum NotificationType {
  APPOINTMENT_CREATED = 'APPOINTMENT_CREATED',
  APPOINTMENT_UPDATED = 'APPOINTMENT_UPDATED',
  APPOINTMENT_CANCELLED = 'APPOINTMENT_CANCELLED',
  APPOINTMENT_COMPLETED = 'APPOINTMENT_COMPLETED',
  APPOINTMENT_REMINDER = 'APPOINTMENT_REMINDER',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  PAYMENT_OVERDUE = 'PAYMENT_OVERDUE',
  REFERRAL_EARNED = 'REFERRAL_EARNED',
  REFERRAL_PAYOUT = 'REFERRAL_PAYOUT',
  STOCK_LOW = 'STOCK_LOW',
  STOCK_OUT = 'STOCK_OUT',
  SYSTEM_UPDATE = 'SYSTEM_UPDATE',
  WELCOME = 'WELCOME'
}

// Interface para dados de notificação
interface NotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: any;
  priority?: 'high' | 'normal' | 'low';
}

// Salvar notificação no banco
async function saveNotification(userId: string, title: string, body: string, type?: string) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        title,
        body,
      },
    });
  } catch (error) {
    console.error('Erro ao salvar notificação:', error);
  }
}

// Enviar notificação push
async function sendPushNotification(userId: string, title: string, body: string, data?: any) {
  const subscriptionRecord = await prisma.pushSubscription.findUnique({
    where: { userId },
  });
  
  const subscription = subscriptionRecord?.subscription;

  if (!subscription) {
    console.log(`Usuário ${userId} não tem push subscription registrada no banco de dados.`);
    return false;
  }

  try {
    // A subscription é enviada para o webpush
    await webpush.sendNotification(
      subscription as unknown as webpush.PushSubscription,
      JSON.stringify({
        title,
        body,
        data: data || {},
        icon: '/notification-icon.png',
        badge: '/notification-badge.png',
        tag: 'hairday-notification'
      })
    );
    return true;
  } catch (error) {
    console.error('Erro ao enviar push notification:', error);
    return false;
  }
}

// Função principal para enviar notificações
export async function sendNotification(notificationData: NotificationData): Promise<boolean> {
  const { userId, type, title, body, data, priority = 'normal' } = notificationData;

  try {
    await saveNotification(userId, title, body, type);
    const pushSent = await sendPushNotification(userId, title, body, data);

    console.log(`Notificação ${type} enviada para usuário ${userId}: ${title}`);
    return pushSent;
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
    return false;
  }
}

// Notificações de Agendamento
export async function notifyAppointmentCreated(appointmentId: string, barberId: string, clientName: string, date: Date, time: string) {
  const barber = await prisma.barber.findUnique({
    where: { id: barberId },
    include: { user: true }
  });

  if (!barber) return;

  await sendNotification({
    userId: barber.userId,
    type: NotificationType.APPOINTMENT_CREATED,
    title: '🎉 Novo Agendamento!',
    body: `${clientName} agendou um serviço para ${date.toLocaleDateString('pt-BR')} às ${time}`,
    data: { appointmentId, type: 'appointment' },
    priority: 'high'
  });
}

export async function notifyAppointmentUpdated(appointmentId: string, barberId: string, clientName: string, date: Date, time: string) {
  const barber = await prisma.barber.findUnique({
    where: { id: barberId },
    include: { user: true }
  });

  if (!barber) return;

  await sendNotification({
    userId: barber.userId,
    type: NotificationType.APPOINTMENT_UPDATED,
    title: '📝 Agendamento Atualizado',
    body: `O agendamento de ${clientName} para ${date.toLocaleDateString('pt-BR')} às ${time} foi modificado`,
    data: { appointmentId, type: 'appointment' },
    priority: 'normal'
  });
}

export async function notifyAppointmentCancelled(appointmentId: string, barberId: string, clientName: string, date: Date, time: string) {
  const barber = await prisma.barber.findUnique({
    where: { id: barberId },
    include: { user: true }
  });

  if (!barber) return;

  await sendNotification({
    userId: barber.userId,
    type: NotificationType.APPOINTMENT_CANCELLED,
    title: '❌ Agendamento Cancelado',
    body: `O agendamento de ${clientName} para ${date.toLocaleDateString('pt-BR')} às ${time} foi cancelado`,
    data: { appointmentId, type: 'appointment' },
    priority: 'normal'
  });
}

export async function notifyAppointmentCompleted(appointmentId: string, barberId: string, clientName: string, total: number) {
  const barber = await prisma.barber.findUnique({
    where: { id: barberId },
    include: { user: true }
  });

  if (!barber) return;

  await sendNotification({
    userId: barber.userId,
    type: NotificationType.APPOINTMENT_COMPLETED,
    title: '✅ Serviço Concluído',
    body: `Serviço para ${clientName} foi concluído. Receita: R$ ${total.toFixed(2)}`,
    data: { appointmentId, type: 'appointment', amount: total },
    priority: 'normal'
  });
}

export async function notifyAppointmentReminder(appointmentId: string, barberId: string, clientName: string, date: Date, time: string) {
  const barber = await prisma.barber.findUnique({
    where: { id: barberId },
    include: { user: true }
  });

  if (!barber) return;

  await sendNotification({
    userId: barber.userId,
    type: NotificationType.APPOINTMENT_REMINDER,
    title: '⏰ Lembrete de Agendamento',
    body: `Você tem um agendamento com ${clientName} hoje às ${time}`,
    data: { appointmentId, type: 'appointment' },
    priority: 'high'
  });
}

// Notificações de Pagamento
export async function notifyPaymentReceived(userId: string, amount: number, description: string) {
  await sendNotification({
    userId,
    type: NotificationType.PAYMENT_RECEIVED,
    title: '💰 Pagamento Recebido',
    body: `Você recebeu R$ ${amount.toFixed(2)} - ${description}`,
    data: { amount, type: 'payment' },
    priority: 'high'
  });
}

export async function notifyPaymentPending(userId: string, amount: number, dueDate: Date) {
  await sendNotification({
    userId,
    type: NotificationType.PAYMENT_PENDING,
    title: '⏳ Pagamento Pendente',
    body: `Você tem um pagamento de R$ ${amount.toFixed(2)} pendente até ${dueDate.toLocaleDateString('pt-BR')}`,
    data: { amount, dueDate, type: 'payment' },
    priority: 'normal'
  });
}

// Notificações de Indicação
export async function notifyReferralEarned(userId: string, referralName: string, discount: number) {
  await sendNotification({
    userId,
    type: NotificationType.REFERRAL_EARNED,
    title: '🎁 Indicação Confirmada!',
    body: `${referralName} se cadastrou usando seu código! Você ganhou R$ ${discount} de desconto`,
    data: { referralName, discount, type: 'referral' },
    priority: 'high'
  });
}

export async function notifyReferralPayout(userId: string, amount: number) {
  await sendNotification({
    userId,
    type: NotificationType.REFERRAL_PAYOUT,
    title: '💸 Pagamento por Indicação',
    body: `Você tem R$ ${amount.toFixed(2)} disponível para saque por suas indicações`,
    data: { amount, type: 'referral' },
    priority: 'high'
  });
}

// Notificações de Estoque
export async function notifyStockLow(userId: string, productName: string, currentStock: number) {
  await sendNotification({
    userId,
    type: NotificationType.STOCK_LOW,
    title: '⚠️ Estoque Baixo',
    body: `${productName} está com estoque baixo (${currentStock} unidades restantes)`,
    data: { productName, currentStock, type: 'stock' },
    priority: 'normal'
  });
}

export async function notifyStockOut(userId: string, productName: string) {
  await sendNotification({
    userId,
    type: NotificationType.STOCK_OUT,
    title: '🚫 Estoque Esgotado',
    body: `${productName} está sem estoque`,
    data: { productName, type: 'stock' },
    priority: 'high'
  });
}

// Notificações do Sistema
export async function notifySystemUpdate(userId: string, updateTitle: string, updateDescription: string) {
  await sendNotification({
    userId,
    type: NotificationType.SYSTEM_UPDATE,
    title: '🔄 Atualização do Sistema',
    body: `${updateTitle}: ${updateDescription}`,
    data: { type: 'system' },
    priority: 'normal'
  });
}

export async function notifyWelcome(userId: string, userName: string) {
  await sendNotification({
    userId,
    type: NotificationType.WELCOME,
    title: '🎉 Bem-vindo ao Hairday!',
    body: `Olá ${userName}! Seja bem-vindo à nossa plataforma. Explore todas as funcionalidades disponíveis.`,
    data: { type: 'welcome' },
    priority: 'normal'
  });
}

// Função para notificar pagamento em atraso (usada pelo job)
export async function notifyPaymentOverdue(userId: string, amount: number, daysOverdue: number) {
  await sendNotification({
    userId,
    type: NotificationType.PAYMENT_OVERDUE,
    title: '🚨 Pagamento em Atraso',
    body: `Seu pagamento de R$ ${amount.toFixed(2)} está ${daysOverdue} dias em atraso`,
    data: { amount, daysOverdue, type: 'payment' },
    priority: 'high'
  });
}

// Notificação para múltiplos usuários
export async function sendBulkNotification(userIds: string[], title: string, body: string, type: NotificationType = NotificationType.SYSTEM_UPDATE) {
  const promises = userIds.map(userId => 
    sendNotification({ userId, type, title, body })
  );
  
  const results = await Promise.allSettled(promises);
  const successful = results.filter(result => result.status === 'fulfilled').length;
  
  console.log(`Notificação em massa enviada: ${successful}/${userIds.length} usuários`);
  return successful;
}

// Notificação para todos os usuários de um tipo específico
export async function notifyAllUsersByRole(role: string, title: string, body: string, type: NotificationType = NotificationType.SYSTEM_UPDATE) {
  const users = await prisma.user.findMany({
    where: { role: role as any },
    select: { id: true }
  });

  const userIds = users.map(user => user.id);
  return await sendBulkNotification(userIds, title, body, type);
}
