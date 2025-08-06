import { Router, Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Product } from '../entity/Product';
import { authenticateJWT } from '../middleware/auth';
import { Unit } from '../entity/Unit';

const router = Router();
const repo = AppDataSource.getRepository(Product);

// Listar todos os produtos
router.get('/', authenticateJWT, async (req, res) => {
  const { unitId } = req.query;
  const where: any = {};
  if (unitId) where.unit = { id: Number(unitId) };
  const products = await repo.find({ where, relations: ['unit'] });
  res.json(products);
});

// Criar produto
router.post('/', authenticateJWT, async (req, res) => {
  const { name, price, stock, category, active, unitId } = req.body;
  if (!name || unitId === undefined) return res.status(400).json({ error: 'Nome e unitId são obrigatórios' });
  const unit = await AppDataSource.getRepository(Unit).findOneBy({ id: unitId });
  if (!unit) return res.status(400).json({ error: 'Unidade não encontrada' });
  const product = repo.create({ name, price, stock, category, active, unit });
  await repo.save(product);
  res.status(201).json(product);
});

// Editar produto
router.put('/:id', authenticateJWT, async (req, res) => {
  const { name, price, stock, category, active, unitId } = req.body;
  const product = await repo.findOneBy({ id: Number(req.params.id) });
  if (!product) return res.status(404).json({ error: 'Produto não encontrado' });
  if (name) product.name = name;
  if (price !== undefined) product.price = price;
  if (stock !== undefined) product.stock = stock;
  if (category !== undefined) product.category = category;
  if (active !== undefined) product.active = active;
  if (unitId) {
    const unit = await AppDataSource.getRepository(Unit).findOneBy({ id: unitId });
    if (!unit) return res.status(400).json({ error: 'Unidade não encontrada' });
    product.unit = unit;
  }
  await repo.save(product);
  res.json(product);
});

// Remover produto
router.delete('/:id', authenticateJWT, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const product = await repo.findOneBy({ id: Number(id) });
    if (!product) return res.status(404).json({ error: 'Produto não encontrado' });
    await repo.remove(product);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: 'Erro ao remover produto', details: err });
  }
});

export default router; 