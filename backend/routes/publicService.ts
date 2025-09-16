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
    console.error("Erro ao criar serviço:", error);
  }
});

// Obter serviço por ID
router.get("/:id", async (req: Request, res: Response) => {
  const serviceId = req.params.id; 
  try {
    const service = await prisma.service.findFirst();
    if (!service) {
      return res.status(404).json({ message: "Serviço não encontrado." });
    }
    console.log("Services encontrados =>", service);
    res.json(service);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter serviço.' });
  }
});

// Deletar serviço
router.delete("/:id", async (req: Request, res: Response) => {
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
