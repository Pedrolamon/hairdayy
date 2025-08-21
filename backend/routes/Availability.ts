import { Router, Request, Response } from "express";
import prisma from "../prisma";
import { Prisma, UserRole } from "@prisma/client";
import { authenticateJWT, AuthRequest } from "../middleware/auth";

const router = Router();

// Rota GET /availability
router.get("/", authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { barber: true },
    });

    if (!user || user.role !== UserRole.BARBER || !user.barber) {
      return res.status(403).json({ message: "Acesso negado. Apenas barbeiros podem ver bloqueios." });
    }

    const blocks = await prisma.availabilityBlock.findMany({
      where: { barberId: user.barber.id },
      orderBy: { date: "asc" },
    });
    res.json(blocks);
  } catch (error) {
    console.error("Erro ao buscar bloqueios:", error);
    res.status(500).json({ error: "Erro ao buscar bloqueios." });
  }
});

// Rota POST /availability
router.post("/", authenticateJWT, async (req: AuthRequest, res: Response) => {
  const { date, startTime, endTime, reason } = req.body;

  if (!date || !startTime || !endTime) {
    return res.status(400).json({ message: "Data, horário inicial e final são obrigatórios." });
  }

  try {
    let user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { barber: true },
    });

    if (!user || user.role !== UserRole.BARBER) {
      return res.status(403).json({ message: "Acesso negado. Apenas barbeiros podem criar bloqueios." });
    }

    const isoDateString = `${date}T00:00:00.000Z`;

    const newBlock = await prisma.availabilityBlock.create({
      data: {
        date: new Date(isoDateString),
        startTime,
        endTime,
        reason,
        barberId: user.barber!.id,
      },
    });
    res.status(201).json(newBlock);
  } catch (error) {
    console.error("Erro ao criar bloqueio:", error);
    res.status(500).json({ error: "Erro ao criar bloqueio." });
  }
});

// Rota DELETE /availability/:id
router.delete("/:id", authenticateJWT, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { barber: true },
    });

    if (!user || user.role !== UserRole.BARBER || !user.barber) {
      return res.status(403).json({ message: "Acesso negado." });
    }

    const block = await prisma.availabilityBlock.findUnique({
      where: { id },
    });

    if (!block) {
      return res.status(404).json({ message: "Bloqueio não encontrado." });
    }

    if (block.barberId !== user.barber.id) {
      return res.status(403).json({ message: "Acesso negado. Você não tem permissão para deletar este bloqueio." });
    }

    await prisma.availabilityBlock.delete({ where: { id } });
    res.json({ message: "Bloqueio removido com sucesso." });
  } catch (error) {
    console.error("Erro ao remover bloqueio:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        return res.status(404).json({ message: "Bloqueio não encontrado." });
    }
    res.status(500).json({ error: "Erro ao remover bloqueio." });
  }
});

export default router;