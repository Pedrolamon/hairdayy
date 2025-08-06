import { Router } from "express";
import { AppDataSource } from "../data-source";
import { Appointment } from "../entity/Appointment";
import { Service } from "../entity/Service";
import { User } from "../entity/User";
import { FinancialRecord } from "../entity/FinancialRecord";
import { authenticateJWT, AuthRequest } from "../middleware/auth";
import { pushSubscriptions } from './notification';
import webpush from 'web-push';
import { Unit } from '../entity/Unit';

const router = Router();
const repo = () => AppDataSource.getRepository(Appointment);
const serviceRepo = () => AppDataSource.getRepository(Service);
const userRepo = () => AppDataSource.getRepository(User);
const financialRepo = () => AppDataSource.getRepository(FinancialRecord);

// Listar agendamentos
router.get('/', authenticateJWT, async (req, res) => {
  const { barberId, userId, unitId } = req.query;
  const where: any = {};
  if (barberId) where.barber = { id: Number(barberId) };
  if (userId) where.user = { id: Number(userId) };
  if (unitId) where.unit = { id: Number(unitId) };
  const appointments = await repo().find({ where, relations: ['user', 'barber', 'services', 'unit'] });
  res.json(appointments);
});

// Obter agendamento por ID
router.get("/:id", authenticateJWT, async (req, res) => {
  const appointment = await repo().findOne({
    where: { id: Number(req.params.id) },
    relations: ["user", "barber", "services"],
  });
  if (!appointment) return res.status(404).json({ message: "Agendamento não encontrado." });
  res.json(appointment);
});

// Buscar horários disponíveis para agendamento
router.get("/available", async (req, res) => {
  const { serviceId, barberId, date } = req.query;
  if (!serviceId || !barberId || !date) {
    return res.status(400).json({ message: "serviceId, barberId e date são obrigatórios." });
  }
  // Buscar serviço para saber a duração
  const service = await AppDataSource.getRepository(Service).findOneBy({ id: Number(serviceId) });
  if (!service) return res.status(404).json({ message: "Serviço não encontrado." });

  // Definir horário de trabalho padrão (exemplo: 09:00 às 18:00)
  const workStart = 9;
  const workEnd = 18;
  const slots: string[] = [];
  for (let hour = workStart; hour <= workEnd - service.duration / 60; hour++) {
    const start = `${hour.toString().padStart(2, '0')}:00`;
    const endHour = hour + service.duration / 60;
    const end = `${Math.floor(endHour).toString().padStart(2, '0')}:${(endHour % 1 === 0.5 ? '30' : '00')}`;
    slots.push(`${start}-${end}`);
  }
  // Buscar agendamentos já existentes para o barbeiro na data
  const appointments = await AppDataSource.getRepository(Appointment).find({
    where: { barber: { id: Number(barberId) }, date: String(date) },
  });
  // Filtrar horários ocupados
  const availableSlots = slots.filter(slot => {
    const [start, end] = slot.split('-');
    return !appointments.some(app => app.startTime === start && app.endTime === end);
  });
  res.json(availableSlots);
});

// Criar agendamento
router.post("/", authenticateJWT, async (req: AuthRequest, res) => {
  const { date, startTime, endTime, serviceIds, barberId, reminderChannel, unitId } = req.body;
  if (!date || !startTime || !endTime || !serviceIds || !Array.isArray(serviceIds) || !unitId) {
    return res.status(400).json({ message: "Dados obrigatórios: date, startTime, endTime, serviceIds, unitId." });
  }
  const user = await userRepo().findOneBy({ id: req.userId });
  if (!user) return res.status(401).json({ message: "Usuário não encontrado." });
  const services = await serviceRepo().findByIds(serviceIds);
  if (services.length !== serviceIds.length) {
    return res.status(400).json({ message: "Um ou mais serviços inválidos." });
  }
  let barber = null;
  if (barberId) {
    barber = await userRepo().findOneBy({ id: barberId });
    if (!barber) return res.status(400).json({ message: "Barbeiro não encontrado." });
  }
  const unit = await AppDataSource.getRepository(Unit).findOneBy({ id: unitId });
  if (!unit) return res.status(400).json({ message: "Unidade não encontrada." });
  // Lógica de conflito de horário pode ser adicionada aqui
  const appointment = repo().create({
    date,
    startTime,
    endTime,
    status: "scheduled",
    user: { id: user.id },
    barber: barber ? { id: barber.id } : undefined,
    services:services.map(s => ({ id: s.id })),
    reminderChannel: reminderChannel || 'email',
    unit:{ id: unit.id },
  });
  await repo().save(appointment);

  // No handler POST /, após salvar o agendamento:
  if (user && pushSubscriptions[user.id]) {
    try {
      await webpush.sendNotification(
        pushSubscriptions[user.id],
        JSON.stringify({
          title: 'Novo agendamento confirmado!',
          body: `Olá ${user.name}, seu agendamento foi confirmado para ${date} às ${startTime}.`
        })
      );
    } catch (err) {
      console.error('Erro ao enviar push:', err);
    }
  }

  res.status(201).json(appointment);
});

// Atualizar agendamento
router.put("/:id", authenticateJWT, async (req, res) => {
  const { date, startTime, endTime, status, serviceIds, barberId, unitId } = req.body;
  const appointment = await repo().findOne({
    where: { id: Number(req.params.id) },
    relations: ["services", "user", "barber", "financialRecords", "unit"],
  });
  if (!appointment) return res.status(404).json({ message: "Agendamento não encontrado." });
  if (date) appointment.date = date;
  if (startTime) appointment.startTime = startTime;
  if (endTime) appointment.endTime = endTime;
  let statusChangedToCompleted = false;
  let statusChangedToCancelled = false;
  if (status && status !== appointment.status) {
    if (status === "completed") statusChangedToCompleted = true;
    if (status === "cancelled") statusChangedToCancelled = true;
    appointment.status = status;
  }
  if (serviceIds && Array.isArray(serviceIds)) {
    const services = await serviceRepo().findByIds(serviceIds);
    if (services.length !== serviceIds.length) {
      return res.status(400).json({ message: "Um ou mais serviços inválidos." });
    }
    appointment.services = services;
  }
  if (barberId) {
    const barber = await userRepo().findOneBy({ id: barberId });
    if (!barber) return res.status(400).json({ message: "Barbeiro não encontrado." });
    appointment.barber = barber;
  }
  if (unitId) {
    const unit = await AppDataSource.getRepository(Unit).findOneBy({ id: unitId });
    if (!unit) return res.status(400).json({ message: "Unidade não encontrada." });
    appointment.unit = unit;
  }
  await repo().save(appointment);

  // Se status mudou para completed, criar registro financeiro
  if (statusChangedToCompleted) {
    const total = appointment.services.reduce((sum, s) => sum + Number(s.price), 0);
    const record = financialRepo().create({
      type: "income",
      amount: total,
      description: `Receita de agendamento #${appointment.id}`,
      date: appointment.date,
      category: "Serviço",
      appointment: appointment,
    });
    await financialRepo().save(record);
  }

  // Se status mudou para cancelled, remover registro financeiro de income vinculado
  if (statusChangedToCancelled) {
    const records = await financialRepo().find({ where: { appointment: { id: appointment.id }, type: "income" } });
    for (const rec of records) {
      await financialRepo().remove(rec);
    }
  }

  res.json(appointment);
});

// Deletar agendamento
router.delete("/:id", authenticateJWT, async (req, res) => {
  const appointment = await repo().findOneBy({ id: Number(req.params.id) });
  if (!appointment) return res.status(404).json({ message: "Agendamento não encontrado." });
  await repo().remove(appointment);
  res.json({ message: "Agendamento removido." });
});

export default router; 