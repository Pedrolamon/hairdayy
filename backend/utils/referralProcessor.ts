import { PrismaClient } from '@prisma/client';
import { notifyReferralEarned, notifyReferralPayout } from './notificationService';

const prisma = new PrismaClient();

// Função para calcular desconto baseado no número de indicações
function calculateDiscount(referralCount: number): number {
  return Math.min(referralCount * 10, 30); // Máximo R$30 de desconto
}

// Função para calcular pagamento quando passa de 3 indicações
function calculatePayout(referralCount: number): number {
  if (referralCount <= 3) return 0;
  return (referralCount - 3) * 10; // R$10 por indicação após a 3ª
}

// Processar indicação quando usuário paga mensalidade
export async function processReferralPayment(userId: string) {
  try {
    // Buscar o usuário que pagou e suas indicações
    const payingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        referralsGot: {
          include: {
            referrer: true
          }
        }
      }
    });

    if (!payingUser) {
      throw new Error('Usuário não encontrado');
    }

    // Processar cada indicação ativa
    for (const referral of payingUser.referralsGot.filter(r => r.active)) {
      const referrer = referral.referrer;
      
      // Contar indicações ativas do referrer
      const activeReferrals = await prisma.referral.count({
        where: {
          referrerId: referrer.id,
          active: true
        }
      });

      const payoutAmount = calculatePayout(activeReferrals);
      
      if (payoutAmount > 0) {
        // Verificar se já existe um pagamento pendente para este referrer
        const existingPayout = await prisma.referralPayout.findFirst({
          where: {
            referrerId: referrer.id,
            status: 'PENDING',
            note: {
              contains: payingUser.name
            }
          }
        });

        if (!existingPayout) {
          // Criar registro de pagamento
          await prisma.referralPayout.create({
            data: {
              referrerId: referrer.id,
              amount: payoutAmount,
              status: 'PENDING',
              note: `Pagamento por indicação - ${payingUser.name} (${activeReferrals} indicações ativas)`
            }
          });

          // Notificar sobre o pagamento disponível
          await notifyReferralPayout(referrer.id, payoutAmount);
        }
      }

      // Notificar sobre a indicação confirmada (se for a primeira vez)
      const isFirstPayment = activeReferrals === 1;
      if (isFirstPayment) {
        await notifyReferralEarned(referrer.id, payingUser.name, 10);
      }
    }

    return { success: true, message: 'Pagamentos processados com sucesso' };
  } catch (error) {
    console.error('Erro ao processar pagamentos de indicação:', error);
    throw error;
  }
}

// Cancelar indicação quando usuário cancela mensalidade
export async function cancelReferralPayment(userId: string) {
  try {
    // Desativar indicações do usuário
    await prisma.referral.updateMany({
      where: { refereeId: userId },
      data: { 
        active: false,
        deactivatedAt: new Date()
      }
    });

    // Cancelar pagamentos pendentes relacionados
    await prisma.referralPayout.updateMany({
      where: {
        referrer: {
          referralsMade: {
            some: {
              refereeId: userId,
              active: false
            }
          }
        },
        status: 'PENDING'
      },
      data: {
        status: 'CANCELLED',
        note: 'Cancelado devido ao cancelamento da assinatura do indicado'
      }
    });

    return { success: true, message: 'Indicações canceladas com sucesso' };
  } catch (error) {
    console.error('Erro ao cancelar indicações:', error);
    throw error;
  }
}

// Calcular desconto atual do usuário
export async function calculateUserDiscount(userId: string): Promise<number> {
  try {
    const activeReferrals = await prisma.referral.count({
      where: {
        referrerId: userId,
        active: true
      }
    });

    return calculateDiscount(activeReferrals);
  } catch (error) {
    console.error('Erro ao calcular desconto:', error);
    return 0;
  }
}

// Calcular pagamento atual do usuário
export async function calculateUserPayout(userId: string): Promise<number> {
  try {
    const activeReferrals = await prisma.referral.count({
      where: {
        referrerId: userId,
        active: true
      }
    });

    return calculatePayout(activeReferrals);
  } catch (error) {
    console.error('Erro ao calcular pagamento:', error);
    return 0;
  }
}
