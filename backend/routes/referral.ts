import { PrismaClient } from '@prisma/client';
import { Router, Request, Response } from "express";
import { authenticateJWT, AuthRequest } from "../middleware/auth";
import { processReferralPayment, cancelReferralPayment, calculateUserDiscount, calculateUserPayout } from "../utils/referralProcessor";
import { notifyReferralEarned, notifyReferralPayout } from "../utils/notificationService";

const router = Router();
const prisma = new PrismaClient();

// Função para gerar código de indicação amigável
function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}


// Buscar informações de indicações do usuário
router.get("/my-referrals", authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Usuário não autenticado." });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: {
        referralsMade: {
          include: {
            referee: {
              select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                subscription: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        referralPayouts: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    const activeReferrals = user.referralsMade.filter(r => r.active);
    const totalReferrals = user.referralsMade.length;
    const currentDiscount = await calculateUserDiscount(req.userId);
    const currentPayout = await calculateUserPayout(req.userId);
    
    const totalPayouts = user.referralPayouts
      .filter(p => p.status === 'PAID')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const pendingPayouts = user.referralPayouts
      .filter(p => p.status === 'PENDING')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    return res.json({
      referralCode: user.referralCode,
      totalReferrals,
      activeReferrals: activeReferrals.length,
      currentDiscount,
      currentPayout,
      totalPayouts,
      pendingPayouts,
      referrals: user.referralsMade,
      payouts: user.referralPayouts
    });
  } catch (error) {
    console.error("Erro ao buscar indicações:", error);
    return res.status(500).json({ message: "Erro interno do servidor." });
  }
});

// Atualizar status de pagamento (apenas para admin)
router.patch("/payout/:payoutId", authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Usuário não autenticado." });
    }

    // Verificar se é admin
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true }
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: "Acesso negado. Apenas administradores." });
    }

    const { payoutId } = req.params;
    const { status, note } = req.body;

    if (!['PENDING', 'PAID', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ message: "Status inválido." });
    }

    const payout = await prisma.referralPayout.update({
      where: { id: payoutId },
      data: {
        status,
        note,
        ...(status === 'PAID' && { paidAt: new Date() }),
        operatorId: req.userId
      },
      include: {
        referrer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return res.json({
      message: "Status de pagamento atualizado com sucesso.",
      payout
    });
  } catch (error) {
    console.error("Erro ao atualizar pagamento:", error);
    return res.status(500).json({ message: "Erro interno do servidor." });
  }
});

// Dashboard de admin - ver todos os pagamentos pendentes
router.get("/admin/payouts", authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Usuário não autenticado." });
    }

    // Verificar se é admin
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true }
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: "Acesso negado. Apenas administradores." });
    }

    const payouts = await prisma.referralPayout.findMany({
      include: {
        referrer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const summary = {
      total: payouts.length,
      pending: payouts.filter(p => p.status === 'PENDING').length,
      paid: payouts.filter(p => p.status === 'PAID').length,
      cancelled: payouts.filter(p => p.status === 'CANCELLED').length,
      totalPendingAmount: payouts
        .filter(p => p.status === 'PENDING')
        .reduce((sum, p) => sum + Number(p.amount), 0),
      totalPaidAmount: payouts
        .filter(p => p.status === 'PAID')
        .reduce((sum, p) => sum + Number(p.amount), 0)
    };

    return res.json({
      summary,
      payouts
    });
  } catch (error) {
    console.error("Erro ao buscar pagamentos:", error);
    return res.status(500).json({ message: "Erro interno do servidor." });
  }
});

// Processar indicação quando usuário paga mensalidade
router.post("/process-payment", authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Usuário não autenticado." });
    }

    const { userId } = req.body; // ID do usuário que pagou

    const result = await processReferralPayment(userId);
    return res.json(result);
  } catch (error) {
    console.error("Erro ao processar pagamentos:", error);
    return res.status(500).json({ message: "Erro interno do servidor." });
  }
});

// Cancelar indicação quando usuário cancela mensalidade
router.post("/cancel-referral", authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Usuário não autenticado." });
    }

    const { userId } = req.body; // ID do usuário que cancelou

    const result = await cancelReferralPayment(userId);
    return res.json(result);
  } catch (error) {
    console.error("Erro ao cancelar indicações:", error);
    return res.status(500).json({ message: "Erro interno do servidor." });
  }
});

export default router;
