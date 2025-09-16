import { PrismaClient } from '@prisma/client';
import { Router, Request, Response } from "express";
import { authenticateJWT, AuthRequest } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

// GET - Buscar nome da empresa (público)
router.get("/business", async (req: Request, res: Response) => {
  try {
    // Buscar o primeiro usuário admin
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      include: { personalInfo: true }
    });

    if (!adminUser || !adminUser.personalInfo) {
      return res.json({ businessname: 'Aparato' }); // Default fallback
    }

    return res.json({ businessname: adminUser.personalInfo.businessname || 'Aparato' });
  } catch (error) {
    console.error("Erro ao buscar nome da empresa:", error);
    return res.status(500).json({ message: "Erro interno do servidor." });
  }
});

// GET - Buscar informações pessoais do usuário autenticado
router.get("/", authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId || typeof req.userId !== 'string') {
      return res.status(401).json({ message: "Usuário não autenticado." });
    }

    const personalInfo = await prisma.personalInformation.findUnique({
      where: { userId: req.userId },
    });

    if (!personalInfo) {
      return res.status(404).json({ message: "Informações pessoais não encontradas." });
    }

    return res.json(personalInfo);
  } catch (error) {
    console.error("Erro ao buscar informações pessoais:", error);
    return res.status(500).json({ message: "Erro interno do servidor." });
  }
});

// PUT - Criar ou atualizar informações pessoais do usuário autenticado
router.put("/", authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId || typeof req.userId !== 'string') {
      return res.status(401).json({ message: "Usuário não autenticado." });
    }

    const {
      businessname,
      daysworked,
      menssage,
      startTime,
      endTime,
      workDays,
      availableDays,
      paymentMethod
    } = req.body;

    const personalInfo = await prisma.personalInformation.upsert({
      where: { userId: req.userId },
      update: {
        businessname,
        daysworked,
        menssage,
        startTime,
        endTime,
        workDays,
        availableDays,
        paymentMethod,
        updatedAt: new Date()
      },
      create: {
        userId: req.userId,
        businessname,
        daysworked,
        menssage,
        startTime,
        endTime,
        workDays,
        availableDays,
        paymentMethod
      }
    });

    return res.json({
      message: "Informações pessoais atualizadas com sucesso.",
      personalInfo
    });
  } catch (error) {
    console.error("Erro ao atualizar informações pessoais:", error);
    return res.status(500).json({ message: "Erro interno do servidor." });
  }
});

export default router;
