import { Router, Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Sale } from '../entity/Sale';
import { Product } from '../entity/Product';
import { authenticateJWT } from '../middleware/auth';

const router = Router();
const saleRepo = AppDataSource.getRepository(Sale);
const productRepo = AppDataSource.getRepository(Product);

// Listar vendas
router.get('/', authenticateJWT, async (_req: Request, res: Response) => {
  const sales = await saleRepo.find({ relations: ['products'] });
  res.json(sales);
});

// Registrar venda
router.post('/', authenticateJWT, async (req: Request, res: Response) => {
  const { clientName, products, quantities, total } = req.body;
  try {
    // Buscar produtos
    const productEntities = await productRepo.findByIds(products);
    // Baixar estoque
    for (const prod of productEntities) {
      const qty = quantities[prod.id] || 1;
      if (prod.stock < qty) {
        return res.status(400).json({ error: `Estoque insuficiente para ${prod.name}` });
      }
      prod.stock -= qty;
      await productRepo.save(prod);
    }
    // Criar venda
    const sale = saleRepo.create({ clientName, products: productEntities, quantities, total });
    await saleRepo.save(sale);
    res.status(201).json(sale);
  } catch (err) {
    res.status(400).json({ error: 'Erro ao registrar venda', details: err });
  }
});

// Detalhes de venda
router.get('/:id', authenticateJWT, async (req: Request, res: Response) => {
  const { id } = req.params;
  const sale = await saleRepo.findOne({ where: { id: Number(id) }, relations: ['products'] });
  if (!sale) return res.status(404).json({ error: 'Venda não encontrada' });
  res.json(sale);
});

export default router; 