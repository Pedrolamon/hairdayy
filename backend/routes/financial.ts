import { Router } from "express";
import { AppDataSource } from "../data-source";
import { FinancialRecord } from "../entity/FinancialRecord";
import { Appointment } from "../entity/Appointment";
import { authenticateJWT } from "../middleware/auth";

const router = Router();
const repo = () => AppDataSource.getRepository(FinancialRecord);
const appointmentRepo = () => AppDataSource.getRepository(Appointment);

// Listar todos os registros financeiros
router.get("/", authenticateJWT, async (req, res) => {
  const records = await repo().find({ relations: ["appointment"] });
  res.json(records);
});

// Obter registro financeiro por ID
router.get("/:id", authenticateJWT, async (req, res) => {
  const record = await repo().findOne({
    where: { id: Number(req.params.id) },
    relations: ["appointment"],
  });
  if (!record) return res.status(404).json({ message: "Registro não encontrado." });
  res.json(record);
});

// Criar registro financeiro
router.post("/", authenticateJWT, async (req, res) => {
  const { type, amount, description, date, category, appointmentId } = req.body;
  if (!type || !amount || !date) {
    return res.status(400).json({ message: "Tipo, valor e data são obrigatórios." });
  }
  let appointment = null;
  if (appointmentId) {
    appointment = await appointmentRepo().findOneBy({ id: appointmentId });
    if (!appointment) return res.status(400).json({ message: "Agendamento não encontrado." });
  }
  const record = new FinancialRecord();
  record.type = type;
  record.amount = amount;
  record.description = description;
  record.date = date;
  record.category = category;
  record.appointment = appointment;
  await repo().save(record);
  res.status(201).json(record);
});

// Atualizar registro financeiro
router.put("/:id", authenticateJWT, async (req, res) => {
  const { type, amount, description, date, category, appointmentId } = req.body;
  const record = await repo().findOne({
    where: { id: Number(req.params.id) },
    relations: ["appointment"],
  });
  if (!record) return res.status(404).json({ message: "Registro não encontrado." });
  if (type) record.type = type;
  if (amount) record.amount = amount;
  if (description) record.description = description;
  if (date) record.date = date;
  if (category) record.category = category;
  if (appointmentId) {
    const appointment = await appointmentRepo().findOneBy({ id: appointmentId });
    if (!appointment) return res.status(400).json({ message: "Agendamento não encontrado." });
    record.appointment = appointment;
  }
  await repo().save(record);
  res.json(record);
});

// Deletar registro financeiro
router.delete("/:id", authenticateJWT, async (req, res) => {
  const record = await repo().findOneBy({ id: Number(req.params.id) });
  if (!record) return res.status(404).json({ message: "Registro não encontrado." });
  await repo().remove(record);
  res.json({ message: "Registro removido." });
});

// Relatório financeiro com filtros
router.get("/report", authenticateJWT, async (req, res) => {
  const { startDate, endDate, type, category, barberId } = req.query;
  let qb = repo().createQueryBuilder("record")
    .leftJoinAndSelect("record.appointment", "appointment")
    .leftJoinAndSelect("appointment.barber", "barber");

  if (startDate) qb = qb.andWhere("record.date >= :startDate", { startDate });
  if (endDate) qb = qb.andWhere("record.date <= :endDate", { endDate });
  if (type) qb = qb.andWhere("record.type = :type", { type });
  if (category) qb = qb.andWhere("record.category = :category", { category });
  if (barberId) qb = qb.andWhere("barber.id = :barberId", { barberId });

  const records = await qb.getMany();

  // Cálculo de totais
  const receitas = records.filter(r => r.type === "income").reduce((acc, r) => acc + Number(r.amount), 0);
  const despesas = records.filter(r => r.type === "expense").reduce((acc, r) => acc + Number(r.amount), 0);
  const balanco = receitas - despesas;

  // Agrupamento por categoria
  const porCategoria = records.reduce((acc, r) => {
    if (!r.category) return acc;
    acc[r.category] = acc[r.category] || { income: 0, expense: 0 };
    acc[r.category][r.type] += Number(r.amount);
    return acc;
  }, {} as Record<string, { income: number; expense: number }>);

  res.json({
    totalReceitas: receitas,
    totalDespesas: despesas,
    balanco,
    porCategoria,
    registros: records,
  });
});

export default router; 