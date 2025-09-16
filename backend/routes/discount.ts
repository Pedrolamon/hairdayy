import { PrismaClient, UserRole } from '@prisma/client';
import { Router, Request, Response } from "express";


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
