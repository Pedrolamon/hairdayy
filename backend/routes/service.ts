import { Router, Request, Response } from 'express';
import prisma from '../prisma'; // Certifique-se de que o Prisma Client está inicializado aqui
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const router = Router();

// Listar todos os serviços
router.get('/', async (req: Request, res: Response) => {
  try {
    const services = await prisma.service.findMany();
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar serviços.' });
  }
});

// Obter serviço por ID
router.get("/:id", authenticateJWT, async (req: Request, res: Response) => {
  const serviceId = req.params.id; 
  try {
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service) {
      return res.status(404).json({ message: "Serviço não encontrado." });
    }
    res.json(service);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter serviço.' });
  }
});

// Criar serviço
router.post("/", authenticateJWT, async (req: AuthRequest, res: Response) => {
  const { name, duration, price } = req.body;
  if (!name || !duration || !price) {
    return res.status(400).json({ message: "Nome, duração e preço são obrigatórios." });
  }
  try {
    const service = await prisma.service.create({
      data: { name, duration, price },
    });
    res.status(201).json(service);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar serviço.' });
  }
});

// Atualizar serviço
router.put("/:id", authenticateJWT, async (req: Request, res: Response) => {
  const { name, duration, price } = req.body;
  const serviceId = req.params.id;
  try {
    const service = await prisma.service.update({
      where: { id: serviceId },
      data: { name, duration, price },
    });
    res.json(service);
  } catch (error: any) {
    if (error.code === 'P2025') { 
      return res.status(404).json({ message: "Serviço não encontrado." });
    }
    res.status(500).json({ error: 'Erro ao atualizar serviço.' });
  }
});

// Deletar serviço
router.delete("/:id", authenticateJWT, async (req: Request, res: Response) => {
  const serviceId = req.params.id;
  try {
    await prisma.service.delete({
      where: { id: serviceId },
    });
    res.json({ message: "Serviço removido." });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: "Serviço não encontrado." });
    }
    res.status(500).json({ error: 'Erro ao deletar serviço.' });
  }
});

export default router;
