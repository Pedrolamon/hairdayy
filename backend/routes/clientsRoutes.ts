import { Router, Request, Response } from "express";
import prisma from "../prisma";
import { authenticateJWT } from "../middleware/auth";
import { Prisma } from '@prisma/client';

const router = Router();

router.get("/", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const clients = await prisma.user.findMany({ where: { role: "CLIENT" } });
    if (!Array.isArray(clients)) {
      return res.status(500).json({ error: "Formato de dados inesperado." });
    }
    res.json(clients);
  } catch (error) {
    console.error("Erro na rota /clients:", error);
    res.status(500).json({ error: "Erro ao listar clientes." });
  }
});

// Detalhes + histórico
router.get("/:id", authenticateJWT, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const client = await prisma.user.findUnique({
      where: { id, role: "CLIENT" },
      include: {
        clientAppointments: {
          include: { services: { include: { service: true } } },
        },
      },
    });

    if (!client) {
      return res.status(404).json({ message: "Cliente não encontrado." });
    }
    const formattedClient = {
      ...client,
      appointments: client.clientAppointments.map(app => ({
        ...app,
        services: app.services.map(s => s.service),
      })),
    };
    delete (formattedClient as any).clientAppointments;

    res.json(formattedClient);
  } catch (error) {
    console.error("Erro na rota /clients/:id:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ message: "Cliente não encontrado." });
    }
    res.status(500).json({ error: "Erro ao obter detalhes do cliente." });
  }
});

// Salvar notas
router.put("/:id/notes", authenticateJWT, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { notes } = req.body;
  if (notes === undefined) {
    return res.status(400).json({ message: "O campo 'notes' é obrigatório." });
  }
  try {
    const client = await prisma.user.update({
      where: { id, role: "CLIENT" },
      data: { notes },
    });
    res.json({ message: "Notas salvas.", client });
  } catch (error) {
    console.error("Erro na rota PUT /clients/:id/notes:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ message: "Cliente não encontrado." });
    }
    res.status(500).json({ error: "Erro ao salvar notas." });
  }
});

export default router;
