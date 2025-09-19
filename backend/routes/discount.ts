import { PrismaClient, UserRole } from '@prisma/client';
import { Router, Request, Response } from "express";
import express from "express";
import bodyParser from "body-parser";



const router = Router();
const prisma = new PrismaClient(); 

router.post("/billing/calculate", async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        referralsMade: {
          where: { active: true },
        },
        subscription: true,
      },
    });

    const results = [];

    for (const user of users) {
      const indicacoesAtivas = user.referralsMade.length;
      let preco = 30;
      let bonus = 0;

      if (indicacoesAtivas >= 3) {
        preco = 0;
      } else if (indicacoesAtivas > 0) {
        preco = 20;
      }

      if (indicacoesAtivas > 3) {
        bonus = (indicacoesAtivas - 3) * 10;
      }

      // atualiza assinatura no banco
      await prisma.subscription.update({
        where: { userId: user.id },
        data: { price: preco },
      });

      // registra bônus financeiro
      if (bonus > 0) {
        await prisma.financialRecord.create({
          data: {
            userId: user.id,
            type: "BONUS",
            amount: bonus,
            description: `Bônus por ${indicacoesAtivas} indicações ativas`,
            date: new Date(),
            category: "Referral",
          },
        });
      }

      results.push({
        user: user.name,
        email: user.email,
        paga: preco,
        recebe: bonus,
        indicacoesAtivas,
      });
    }

    return res.status(200).json({ message: "Cálculo concluído", results });
  } catch (error) {
    console.error("Erro no cálculo mensal:", error);
    return res.status(500).json({ message: "Erro no servidor." });
  }
});

router.get('/admin/referrals/payouts/pending', async (req, res) => {
  const payouts = await prisma.referralPayout.findMany({
    where: { status: 'PENDING' },
    include: { referrer: true }
  });
  res.json(payouts);
});


router.post('/admin/referrals/payouts/:id/mark-paid', async (req, res) => {
  const { id } = req.params;
  const { operatorId, note } = req.body;

  const payout = await prisma.referralPayout.update({
    where: { id },
    data: {
      status: 'PAID',
      paidAt: new Date(),
      operatorId,
      note
    },
  });

  // criar registro financeiro de saída
  await prisma.financialRecord.create({
    data: {
      userId: payout.referrerId,
      type: 'REFERRAL_PAYOUT',
      amount: payout.amount,
      description: `Payout via PIX ${id}`,
      date: new Date(),
      category: 'Referral'
    }
  });

  res.json(payout);
});

router.get('/user/:id/referrals/summary', async (req, res) => {
  const userId = req.params.id;

  // contar indicações ativas
  const activeCount = await prisma.referral.count({ where: { referrerId: userId, active: true } });
  const discount = Math.min(activeCount * 10, 30);

  // somar payouts pendentes
  const pendingPayouts = await prisma.referralPayout.aggregate({
    where: { referrerId: userId, status: 'PENDING' },
    _sum: { amount: true }
  });

  res.json({
    activeCount,
    discount,
    pendingPayout: pendingPayouts._sum.amount || 0
  });
});



// --- Usuário: resumo de indicações ---
router.get("/user/:id/referrals/summary", async (req, res) => {
  const userId = req.params.id;
  try {
    const activeCount = await prisma.referral.count({
      where: { referrerId: userId, active: true },
    });

    const discount = Math.min(activeCount * 10, 30);

    const pendingPayouts = await prisma.referralPayout.aggregate({
      where: { referrerId: userId, status: "PENDING" },
      _sum: { amount: true },
    });

    res.json({
      activeCount,
      discount,
      pendingPayout: pendingPayouts._sum.amount || 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro no servidor" });
  }
});

// --- Admin: listar payouts pendentes ---
router.get("/admin/referrals/payouts/pending", async (_, res) => {
  try {
    const payouts = await prisma.referralPayout.findMany({
      where: { status: "PENDING" },
      include: { referrer: true },
    });
    res.json(payouts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro no servidor" });
  }
});

// --- Admin: marcar payout como pago ---
router.post("/admin/referrals/payouts/:id/mark-paid", async (req, res) => {
  const { id } = req.params;
  const { operatorId, note } = req.body;

  try {
    const payout = await prisma.referralPayout.update({
      where: { id },
      data: {
        status: "PAID",
        paidAt: new Date(),
        operatorId,
        note,
      },
    });

    await prisma.financialRecord.create({
      data: {
        userId: payout.referrerId,
        type: "REFERRAL_PAYOUT",
        amount: payout.amount,
        description: `Payout via PIX ${id}`,
        date: new Date(),
        category: "Referral",
      },
    });

    res.json(payout);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro no servidor" });
  }
});

export default router;
