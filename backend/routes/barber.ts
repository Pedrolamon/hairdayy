import { Router } from "express";
import { AppDataSource } from "../data-source";
import { Barber } from "../entity/Barber";
import { User } from "../entity/User";
import { AvailabilityBlock } from "../entity/AvailabilityBlock";
import { authenticateJWT } from "../middleware/auth";
import { Unit } from '../entity/Unit';

const router = Router();
const repo = () => AppDataSource.getRepository(Barber);
const userRepo = () => AppDataSource.getRepository(User);

// Listar todos os barbeiros
router.get("/", authenticateJWT, async (req, res) => {
  const { unitId } = req.query;
  const where: any = {};
  if (unitId) where.unit = { id: Number(unitId) };
  const barbers = await repo().find({ where, relations: ["user", "appointments", "unit"] });
  res.json(barbers);
});

// Obter barbeiro por ID
router.get("/:id", authenticateJWT, async (req, res) => {
  const barber = await repo().findOne({
    where: { id: Number(req.params.id) },
    relations: ["user", "appointments"],
  });
  if (!barber) return res.status(404).json({ message: "Barbeiro não encontrado." });
  res.json(barber);
});

// Criar barbeiro
router.post("/", authenticateJWT, async (req, res) => {
  const { name, userId, commission, unitId } = req.body;
  if (!name || !userId || !unitId) {
    return res.status(400).json({ message: "Nome, userId e unitId são obrigatórios." });
  }
  const user = await userRepo().findOneBy({ id: userId });
  if (!user) return res.status(400).json({ message: "Usuário não encontrado." });
  const unit = await AppDataSource.getRepository(Unit).findOneBy({ id: unitId });
  if (!unit) return res.status(400).json({ message: "Unidade não encontrada." });
  const barber = repo().create({ name, user, commission, unit });
  await repo().save(barber);
  res.status(201).json(barber);
});

// Atualizar barbeiro
router.put("/:id", authenticateJWT, async (req, res) => {
  const { name, userId, commission, unitId } = req.body;
  const barber = await repo().findOne({
    where: { id: Number(req.params.id) },
    relations: ["user", "unit"],
  });
  if (!barber) return res.status(404).json({ message: "Barbeiro não encontrado." });
  if (name) barber.name = name;
  if (userId) {
    const user = await userRepo().findOneBy({ id: userId });
    if (!user) return res.status(400).json({ message: "Usuário não encontrado." });
    barber.user = user;
  }
  if (commission !== undefined) barber.commission = commission;
  if (unitId) {
    const unit = await AppDataSource.getRepository(Unit).findOneBy({ id: unitId });
    if (!unit) return res.status(400).json({ message: "Unidade não encontrada." });
    barber.unit = unit;
  }
  await repo().save(barber);
  res.json(barber);
});

// Deletar barbeiro
router.delete("/:id", authenticateJWT, async (req, res) => {
  const barber = await repo().findOneBy({ id: Number(req.params.id) });
  if (!barber) return res.status(404).json({ message: "Barbeiro não encontrado." });
  await repo().remove(barber);
  res.json({ message: "Barbeiro removido." });
});

// Listar bloqueios do barbeiro autenticado
router.get("/availability", authenticateJWT, async (req: any, res) => {
  const repo = req.app.get("dataSource").getRepository(AvailabilityBlock);
  const blocks = await repo.find({ where: { barber: { id: req.userId } } });
  res.json(blocks);
});
// Criar bloqueio
router.post("/availability", authenticateJWT, async (req: any, res) => {
  const repo = req.app.get("dataSource").getRepository(AvailabilityBlock);
  const { date, startTime, endTime, reason } = req.body;
  if (!date || !startTime || !endTime) return res.status(400).json({ message: "Campos obrigatórios." });
  const block = repo.create({ date, startTime, endTime, reason, barber: { id: req.userId } });
  await repo.save(block);
  res.status(201).json(block);
});
// Remover bloqueio
router.delete("/availability/:id", authenticateJWT, async (req: any, res) => {
  const repo = req.app.get("dataSource").getRepository(AvailabilityBlock);
  const block = await repo.findOne({ where: { id: Number(req.params.id), barber: { id: req.userId } } });
  if (!block) return res.status(404).json({ message: "Bloqueio não encontrado." });
  await repo.remove(block);
  res.json({ message: "Bloqueio removido." });
});

// Listar clientes
router.get("/clients", authenticateJWT, async (req: any, res) => {
  const userRepo = req.app.get("dataSource").getRepository("User");
  const clients = await userRepo.find({ where: { role: "client" } });
  res.json(clients);
});
// Detalhes + histórico
router.get("/clients/:id", authenticateJWT, async (req: any, res) => {
  const userRepo = req.app.get("dataSource").getRepository("User");
  const appointmentRepo = req.app.get("dataSource").getRepository("Appointment");
  const client = await userRepo.findOne({ where: { id: Number(req.params.id), role: "client" } });
  if (!client) return res.status(404).json({ message: "Cliente não encontrado." });
  const appointments = await appointmentRepo.find({ where: { user: { id: client.id } }, relations: ["services"] });
  res.json({ ...client, appointments });
});
// Salvar notas
router.put("/clients/:id/notes", authenticateJWT, async (req: any, res) => {
  const userRepo = req.app.get("dataSource").getRepository("User");
  const client = await userRepo.findOne({ where: { id: Number(req.params.id), role: "client" } });
  if (!client) return res.status(404).json({ message: "Cliente não encontrado." });
  client.notes = req.body.notes;
  await userRepo.save(client);
  res.json({ message: "Notas salvas." });
});

export default router; 