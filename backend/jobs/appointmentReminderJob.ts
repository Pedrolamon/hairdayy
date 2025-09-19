import { PrismaClient } from '@prisma/client';
import { notifyAppointmentReminder, notifyPaymentOverdue,notifyStockOut, notifyStockLow } from '../utils/notificationService';

const prisma = new PrismaClient();

// Função para enviar lembretes de agendamento
export async function sendAppointmentReminders() {
  try {
    console.log('Verificando lembretes de agendamento...');
    
    // Buscar agendamentos para hoje que ainda não foram lembrados
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const appointments = await prisma.appointment.findMany({
      where: {
        date: {
          gte: startOfDay,
          lt: endOfDay,
        },
        status: 'SCHEDULED',
        reminderSent: false,
      },
      include: {
        barber: {
          include: {
            user: true
          }
        }
      }
    });

    console.log(`Encontrados ${appointments.length} agendamentos para lembrar hoje`);

    for (const appointment of appointments) {
      const appointmentTime = new Date(`${appointment.date.toISOString().split('T')[0]}T${appointment.startTime}`);
      const now = new Date();
      const timeDiff = appointmentTime.getTime() - now.getTime();
      const hoursUntilAppointment = timeDiff / (1000 * 60 * 60);

      // Enviar lembrete 2 horas antes do agendamento
      if (hoursUntilAppointment <= 2 && hoursUntilAppointment > 0) {
        await notifyAppointmentReminder(
          appointment.id,
          appointment.barberId,
          appointment.clientName || 'Cliente',
          appointment.date,
          appointment.startTime
        );

        // Marcar como lembrado
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: { reminderSent: true }
        });

        console.log(`Lembrete enviado para agendamento ${appointment.id}`);
      }
    }

    return { success: true, remindersSent: appointments.length };
  } catch (error: any) {
    console.error('Erro ao enviar lembretes de agendamento:', error);
    return { success: false, error: error.message };
  }
}

// Função para verificar pagamentos pendentes
export async function checkPendingPayments() {
  try {
    console.log('Verificando pagamentos pendentes...');
    
    const today = new Date();
    const threeDaysAgo = new Date(today.getTime() - (3 * 24 * 60 * 60 * 1000));
    
    // Buscar usuários com pagamentos em atraso
    const overdueUsers = await prisma.user.findMany({
      where: {
        subscription: {
          status: 'ACTIVE'
        },
        createdAt: {
          lte: threeDaysAgo
        }
      },
      include: {
        subscription: true
      }
    });

    console.log(`Encontrados ${overdueUsers.length} usuários com possível pagamento em atraso`);

    for (const user of overdueUsers) {
      // Verificar se há registros financeiros recentes
      const recentPayments = await prisma.financialRecord.findMany({
        where: {
          userId: user.id,
          type: 'income',
          createdAt: {
            gte: threeDaysAgo
          }
        }
      });

      // Se não há pagamentos recentes, notificar
      if (recentPayments.length === 0) {
        const daysOverdue = Math.floor((today.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)) - 3;
        
        if (daysOverdue > 0) {
          await notifyPaymentOverdue(user.id, user.subscription?.price || 30, daysOverdue);
          console.log(`Notificação de pagamento em atraso enviada para ${user.name}`);
        }
      }
    }

    return { success: true, overdueUsers: overdueUsers.length };
  } catch (error: any) {
    console.error('Erro ao verificar pagamentos pendentes:', error);
    return { success: false, error: error.message };
  }
}


// Função para verificar estoque baixo
export async function checkLowStock() {
  try {
    console.log('Verificando estoque baixo...');
    
    const lowStockProducts = await prisma.product.findMany({
      where: {
        stock: {
          lte: 5
        },
        active: true
      },
      include: {
        user: true
      }
    });

    console.log(`Encontrados ${lowStockProducts.length} produtos com estoque baixo`);

    for (const product of lowStockProducts) {
      if (product.stock === 0) {
        await notifyStockOut(product.userId, product.name);
      } else {
        await notifyStockLow(product.userId, product.name, product.stock);
      }
    }

    return { success: true, lowStockProducts: lowStockProducts.length };
  } catch (error: any) {
    console.error('Erro ao verificar estoque baixo:', error);
    return { success: false, error: error.message };
  }
}

// Função para limpar notificações antigas
export async function cleanupOldNotifications() {
  try {
    console.log('Limpando notificações antigas...');
    
    const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
    
    const deletedCount = await prisma.notification.deleteMany({
      where: {
        date: {
          lt: thirtyDaysAgo
        },
        read: true
      }
    });

    console.log(`${deletedCount.count} notificações antigas removidas`);
    return { success: true, deletedCount: deletedCount.count };
  } catch (error: any) {
    console.error('Erro ao limpar notificações antigas:', error);
    return { success: false, error: error.message };
  }
}
