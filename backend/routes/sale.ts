import { Router, Request, Response } from 'express';
import { PrismaClient, Product } from '@prisma/client';
import prisma from '../prisma'; // Assumindo que o Prisma Client está inicializado aqui
import { authenticateJWT, AuthRequest } from '../middleware/auth';

const router = Router();

// Listar vendas
router.get('/', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const sales = await prisma.sale.findMany({
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
  const { clientName, products, quantities, total } = req.body;

  try {
    const newSale = await prisma.$transaction(async (tx) => {
      const productIds = products as string[];

      const productEntities = await tx.product.findMany({
        where: {
          id: { in: productIds },
        },
      });

      // Mapear produtos para um objeto de fácil acesso
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

      // Criar a venda e a tabela de união (SaleProduct)
      const sale = await tx.sale.create({
        data: {
          clientName,
          total,
          quantities,
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

    res.status(201).json(newSale);

  } catch (err) {
    const errorMessage = (err instanceof Error) ? err.message : 'Erro desconhecido ao registrar venda.';
    res.status(400).json({ error: 'Erro ao registrar venda', details: errorMessage });
  }
});

// Detalhes de venda
router.get('/:id', authenticateJWT, async (req: Request, res: Response) => {
  const { id } = req.params;
  const sale = await prisma.sale.findUnique({
    where: { id },
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
