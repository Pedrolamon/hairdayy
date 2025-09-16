import { Router, Request, Response } from 'express';
import prisma from '../prisma'; 
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { PrismaClient, Product } from '@prisma/client'; 

const router = Router();

// Listar todos os produtos 
router.get('/', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Não autorizado.' });
    }
    const products = await prisma.product.findMany({
      where: {
        userId: req.userId
      }
    });
    res.json(products);
  } catch (error: unknown) {
    res.status(500).json({ error: 'Erro ao listar produtos.' });
  }
});

// Criar produto
router.post('/', authenticateJWT, async (req: AuthRequest, res: Response) => {
  const { name, price,stock, category, active } = req.body;
 
if (!req.userId) {
    return res.status(401).json({ error: 'Não autorizado.' });
  }

    if (!name) {
    return res.status(400).json({ error: 'Nome é obrigatório.' });
  }
    const Price = Number(price);
    const Stock = Number(stock);
    
    const stockValue = Price * Stock;
  
    try {
    const product = await prisma.product.create({
      data: {
        name,
        price: Price,
        stock: Stock,
        stockValue,
        category,
        active,
        user: { connect: { id: req.userId } },
      },
    });
    res.status(201).json(product);
  } catch (error: unknown) {
    res.status(500).json({ error: 'Erro ao criar produto.' });
  }
});

// Editar produto
router.put('/:id', authenticateJWT, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, price, stock, category, active } = req.body;
  
  const updateData: any = {};
  if (name) updateData.name = name;
  if (price !== undefined) updateData.price = price;
  if (stock !== undefined) updateData.stock = stock;
  if (category !== undefined) updateData.category = category;
  if (active !== undefined) updateData.active = active;
  
  try {
    const product = await prisma.product.update({
      where: { id },
      data: updateData,
    });
    res.json(product);
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }
    res.status(500).json({ error: 'Erro ao editar produto.' });
  }
});

// Remover produto
router.delete('/:id', authenticateJWT, async (req:  AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Não autorizado.' });
    }
    
    const product = await prisma.product.delete({
      where: { id },
    });
    res.json({ success: true, message: 'Produto removido com sucesso.' });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }
    res.status(500).json({ error: 'Erro ao remover produto.' });
  }
});

export default router;