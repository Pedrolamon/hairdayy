import { Router, Request, Response } from "express";
import prisma from "../prisma";
import { authenticateJWT, AuthRequest } from "../middleware/auth";
import { Prisma } from '@prisma/client';

const router = Router();
//rota para buscar clientes 
router.get("/", authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: "CLIENT",
        createdByAdminId: req.userId,
       },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        notes: true,
        isBlocked: true,
        createdAt: true,
      },
    });

    const appointments = await prisma.appointment.findMany({
      where: {
        barber: { userId: req.userId },
        clientName: { not: null },
        phone: { not: null },
      },
      select: {
        clientName: true,
        phone: true,
      },
    });

    // 3. Normaliza os clientes do chatbot
    const chatbotClients = appointments.map(app => ({
      id: `chatbot-${app.phone}`, 
      name: app.clientName!,
      email: null,
      phone: app.phone!,
      notes: null,
      isBlocked: false,
      createdAt: null,
    }));

    const merged = [...users, ...chatbotClients];
    const uniqueClients = Array.from(
      new Map(merged.map(c => [c.phone || c.id, c])).values()
    );

    res.json(uniqueClients);
  } catch (error) {
    console.error("Erro na rota /clients:", error);
    res.status(500).json({ error: "Erro ao listar clientes." });
  }
});

// Detalhes + histórico
router.get("/:id", authenticateJWT, async (req: AuthRequest, res: Response) => {
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
router.put("/:id/notes", authenticateJWT, async (req: AuthRequest, res: Response) => {
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

router.put("/:id/block", authenticateJWT, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const client = await prisma.user.findUnique({
      where: { id },
      select: { id: true, isBlocked: true, role: true },
    });

    if (!client || client.role !== "CLIENT") {
      return res.status(404).json({ message: "Cliente não encontrado." });
    }

    const updatedClient = await prisma.user.update({
      where: { id },
      data: { isBlocked: !client.isBlocked },
    });

    res.json({
      message: `Cliente ${updatedClient.isBlocked ? "bloqueado" : "desbloqueado"} com sucesso.`,
      client: updatedClient,
    });
  } catch (error) {
    console.error("Erro na rota PUT /clients/:id/block:", error);
    res.status(500).json({ error: "Erro ao bloquear/desbloquear cliente." });
  }
});


export default router;
