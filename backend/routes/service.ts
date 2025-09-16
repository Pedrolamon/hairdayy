import { Router, Request, Response } from 'express';
import prisma from '../prisma'; // Certifique-se de que o Prisma Client está inicializado aqui
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const router = Router();

// Listar todos os serviços
router.get('/',authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      console.log("req.userId =>", req.userId);
      return res.status(401).json({ message: "Não autorizado." });
      
    }
    const services = await prisma.service.findMany({
      where: {
        userId: req.userId
      }
    });
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar serviços.' });
    console.error("Erro ao criar serviço:", error);
  }
});

// Obter serviço por ID
router.get("/:id", authenticateJWT, async (req: AuthRequest, res: Response) => {
  const serviceId = req.params.id; 
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Não autorizado." });
    }
    const service = await prisma.service.findFirst({
      where: { id: serviceId, userId: req.userId  },
    });
    if (!service) {
      return res.status(404).json({ message: "Serviço não encontrado." });
    }
    console.log("Services encontrados =>", service);
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
  
  if (!req.userId) {
    return res.status(401).json({ message: "Não autorizado." });
  }
  
  try {
    const service = await prisma.service.create({
      data: { name, duration, price, userId: req.userId  },
    });
    res.status(201).json(service);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar serviço.' });
    console.error("Erro ao criar serviço:", error);
  }
});

// Atualizar serviço
router.put("/:id", authenticateJWT, async (req: AuthRequest, res: Response) => {
  const { name, duration, price } = req.body;
  const serviceId = req.params.id;
      if (!req.userId) {
      return res.status(401).json({ message: "Não autorizado." });
    }
  try {
    const existingService = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!existingService || existingService.userId !== req.userId) {
      return res.status(403).json({ message: "Acesso negado. Você não tem permissão para atualizar este serviço." });
    }

    const service = await prisma.service.update({
      where: { id: serviceId },
      data: { name, duration, price },
    });
    res.json(service);
  } catch (error: any) {
    console.error("Erro ao criar serviço:", error);
    if (error.code === 'P2025') { 
      return res.status(404).json({ message: "Serviço não encontrado." });
    }
    res.status(500).json({ error: 'Erro ao atualizar serviço.' });
  }
});

// Deletar serviço
router.delete("/:id", authenticateJWT, async (req: AuthRequest, res: Response) => {
  const serviceId = req.params.id;
  if (!req.userId) {
      return res.status(401).json({ message: "Não autorizado." });
    }
  try {
    const existingService = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!existingService || existingService.userId !== req.userId) {
      return res.status(403).json({ message: "Acesso negado. Você não tem permissão para deletar este serviço." });
    }
    
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
