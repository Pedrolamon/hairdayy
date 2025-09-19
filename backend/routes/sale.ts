import { Router, Request, Response } from 'express';
import { PrismaClient, Product } from '@prisma/client';
import prisma from '../prisma'; // Assumindo que o Prisma Client está inicializado aqui
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { notifyStockLow, notifyStockOut } from "../utils/notificationService";

const router = Router();

// Listar vendas
router.get('/', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Não autorizado." });
    }
    
    const sales = await prisma.sale.findMany({
      where: {
    userId: req.userId!,
    },
      include: {
        products: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });
      const formattedSales = sales.map(sale => ({
      ...sale,
      products: sale.products.map(sp => sp.product),
    }));
    res.json(formattedSales);
  } catch (error: unknown) {
    res.status(500).json({ error: 'Erro ao listar vendas.' });
  }
});

// Registrar venda
router.post('/', authenticateJWT, async (req: AuthRequest, res: Response) => {
  const { clientName, products, quantities,sellingPrice, total } = req.body;

  if (!req.userId) {
    return res.status(401).json({ message: "Não autorizado." });
  }

  try {
    const newSale = await prisma.$transaction(async (tx) => {
      const productIds = products as string[];

      const productEntities = await tx.product.findMany({
        where: {
          id: { in: productIds },
        },
      });

      
      const productMap = new Map(productEntities.map((p: Product) => [p.id, p]));
      

      for (const productId of productIds) {
        const product = productMap.get(productId);
        const quantity = quantities[productId] || 1;

        if (!product || product.stock < quantity) {
          throw new Error(`Estoque insuficiente ou produto não encontrado para o ID: ${productId}`);
        }

        // Atualizar estoque
        await tx.product.update({
          where: { id: productId },
          data: { stock: { decrement: quantity } },
        });
      }

      const sale = await tx.sale.create({
        data: {
          clientName,
          total,
          quantities,
          userId: req.userId!,
          products: {
            create: productIds.map(productId => ({
              quantity: quantities[productId] || 1,
              product: {
                connect: { id: productId },
              },
            })),
          },
        },
        include: {
          products: {
            include: {
              product: true,
            },
          },
        },
      });
      return sale;
    });

    // Verificar estoque após a venda e enviar notificações se necessário
    for (const saleProduct of newSale.products) {
      const product = saleProduct.product;
      const newStock = product.stock;
      
      if (newStock === 0) {
        await notifyStockOut(req.userId!, product.name);
      } else if (newStock <= 5) { // Considerar estoque baixo se <= 5 unidades
        await notifyStockLow(req.userId!, product.name, newStock);
      }
    }

    res.status(201).json(newSale);

  } catch (err) {
    const errorMessage = (err instanceof Error) ? err.message : 'Erro desconhecido ao registrar venda.';
    res.status(400).json({ error: 'Erro ao registrar venda', details: errorMessage });
  }
});

// Detalhes de venda
router.get('/:id', authenticateJWT, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  if (!req.userId) {
    return res.status(401).json({ message: "Não autorizado." });
  }
  const sale = await prisma.sale.findFirst({
    where: { id, userId: req.userId },
    include: {
      products: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!sale) {
    return res.status(404).json({ error: 'Venda não encontrada' });
  }
  res.json(sale);
});

export default router;
