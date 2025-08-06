import { Router, Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Unit } from '../entity/Unit';
import { authenticateJWT } from '../middleware/auth';

const router = Router();
const repo = AppDataSource.getRepository(Unit);

// Listar unidades
router.get('/', authenticateJWT, async (_req: Request, res: Response) => {
  const units = await repo.find();
  res.json(units);
});

// Criar unidade
router.post('/', authenticateJWT, async (req: Request, res: Response) => {
  const { name, address, phone } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });
  const unit = repo.create({ name, address, phone });
  await repo.save(unit);
  res.status(201).json(unit);
});

// Editar unidade
router.put('/:id', authenticateJWT, async (req: Request, res: Response) => {
  const { name, address, phone } = req.body;
  const unit = await repo.findOneBy({ id: Number(req.params.id) });
  if (!unit) return res.status(404).json({ error: 'Unidade não encontrada' });
  if (name) unit.name = name;
  if (address !== undefined) unit.address = address;
  if (phone !== undefined) unit.phone = phone;
  await repo.save(unit);
  res.json(unit);
});

// Remover unidade
router.delete('/:id', authenticateJWT, async (req: Request, res: Response) => {
  const unit = await repo.findOneBy({ id: Number(req.params.id) });
  if (!unit) return res.status(404).json({ error: 'Unidade não encontrada' });
  await repo.remove(unit);
  res.json({ success: true });
});

export default router; 