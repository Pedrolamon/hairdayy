import 'dotenv/config'; 
import { Router, Request, Response } from "express";
import prisma from "../prisma";
import { pushSubscriptions } from './notification';
import webpush from 'web-push';
import { Prisma, Service, AppointmentService, Appointment, AppointmentStatus } from '@prisma/client';
//middleware
import { authenticateJWT, AuthRequest } from "../middleware/auth";
import { 
  notifyAppointmentCreated, 
  notifyAppointmentUpdated, 
  notifyAppointmentCancelled, 
  notifyAppointmentCompleted 
} from "../utils/notificationService";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
dayjs.extend(utc);
dayjs.extend(timezone);

const TZ = process.env.TIMEZONE || 'America/Sao_Paulo';
const router = Router();


// 📌 Listar agendamentos
router.get('/', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { barber: true }
    });

    if (!user || !user.barber) {
      return res.status(403).json({ message: "Acesso negado. Usuário não encontrado." });
    }

    const { clientId, date, period } = req.query;
    const where: Prisma.AppointmentWhereInput = {
      barberId: user.barber.id,
    };

    if (clientId) {
      where.clientId = clientId as string;
    }

    // 🔹 Filtro por data
    if (date) {
      const localDate = dayjs.tz(String(date), TZ);
      const startOfDay = localDate.startOf('day').utc().toDate();
      const endOfDay = localDate.endOf('day').utc().toDate();

      where.date = { gte: startOfDay, lt: endOfDay };
    } else if (period && period !== 'all') {
      const now = dayjs().tz(TZ);
      let startDate: Date;
      let endDate: Date;

      switch (period) {
        case 'today':
          startDate = now.startOf('day').toDate();
          endDate = now.endOf('day').toDate();;
          break;
        case 'week':
          const dayOfWeek = now.day();
          startDate = now.subtract(dayOfWeek, 'day').startOf('day').toDate();
          endDate = dayjs(startDate).add(7, 'day').toDate();
          break;
        case 'month':
          startDate = now.startOf('month').toDate();
          endDate = now.add(1, 'month').startOf('month').toDate();
          break;
        default:
          return res.status(400).json({ message: "Período inválido. Use 'all', 'today', 'week' ou 'month'." });
      }

      where.date = { gte: startDate, lt: endDate };
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        client: true,
        barber: { include: { user: true } },
        services: { include: { service: true } },
      },
      orderBy: { date: 'asc' },
    });

    res.json(appointments);
  } catch (error: unknown) {
    res.status(500).json({ error: "Erro ao listar agendamentos." });
  }
});


// 📌 Buscar horários disponíveis
router.get("/available", authenticateJWT, async (req: AuthRequest, res: Response) => {
  const { serviceId, barberId, date } = req.query;

  if (!serviceId || !barberId || !date) {
    return res.status(400).json({ message: "serviceId, barberId e date são obrigatórios." });
  }

  try {
    const service = await prisma.service.findUnique({ where: { id: serviceId as string } });
    if (!service) {
      return res.status(404).json({ message: "Serviço não encontrado." });
    }

    const selectedDate = dayjs.tz(String(date), TZ).startOf('day').toDate();

    const barberInfo = await prisma.personalInformation.findUnique({
      where: { userId: barberId as string },
    });

    const workStart = barberInfo?.startTime ? parseFloat(barberInfo.startTime) : 8;
    const workEnd = barberInfo?.endTime ? parseFloat(barberInfo.endTime) : 18;
    const serviceDurationHours = service.duration / 60;

    const slots: string[] = [];
    for (let hour = workStart; hour <= workEnd - serviceDurationHours; hour += 0.5) {
      const startMinutes = Math.floor(hour * 60);
      const startHours = Math.floor(startMinutes / 60).toString().padStart(2, '0');
      const startMins = (startMinutes % 60).toString().padStart(2, '0');
      const start = `${startHours}:${startMins}`;

      const endMinutes = Math.floor((hour + serviceDurationHours) * 60);
      const endHours = Math.floor(endMinutes / 60).toString().padStart(2, '0');
      const endMins = (endMinutes % 60).toString().padStart(2, '0');
      const end = `${endHours}:${endMins}`;

      slots.push(`${start}-${end}`);
    }

    const [appointments, blockedBlocks] = await Promise.all([
      prisma.appointment.findMany({
        where: { barberId: barberId as string, date: selectedDate },
      }),
      prisma.availabilityBlock.findMany({
        where: { barberId: barberId as string, date: selectedDate },
      }),
    ]);

    const occupiedSlots = [...appointments, ...blockedBlocks];

    const availableSlots = slots.filter(slot => {
      const [start, end] = slot.split('-');
      return !occupiedSlots.some((occupied: any) =>
        (start >= occupied.startTime && start < occupied.endTime) ||
        (end > occupied.startTime && end <= occupied.endTime) ||
        (start < occupied.startTime && end > occupied.endTime)
      );
    });

    res.json(availableSlots);
  } catch (error: unknown) {
    console.error("Erro ao buscar horários disponíveis:", error);
    res.status(500).json({ error: "Erro ao buscar horários disponíveis." });
  }
});


// 📌 Contar agendamentos
router.get("/count", authenticateJWT, async (req: AuthRequest, res: Response) => {
  const { period } = req.query;

  if (!period) return res.status(400).json({ message: "Período é obrigatório." });

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { barber: true }
    });

    if (!user || !user.barber) {
      return res.status(403).json({ message: "Acesso negado. Usuário não encontrado ou não é um barbeiro." });
    }

    const now = dayjs().tz(TZ);
    let startDate: Date;
    let endDate: Date;

    switch (period) {
      case 'day':
        startDate = now.startOf('day').toDate();
        endDate = now.endOf('day').toDate();
        break;
      case 'week':
        startDate = now.startOf('week').toDate();
        endDate = now.endOf('week').add(1, 'second').toDate();
        break;
      case 'month':
        startDate = now.startOf('month').toDate();
        endDate = now.add(1, 'month').startOf('month').toDate();
        break;
      default:
        return res.status(400).json({ message: "Período inválido. Use 'day', 'week' ou 'month'." });
    }

    const count = await prisma.appointment.count({
      where: { barberId: user.barber.id, date: { gte: startDate, lt: endDate } },
    });

    res.json({ count });
  } catch (error) {
    console.error("Erro ao contar agendamentos:", error);
    res.status(500).json({ message: "Erro ao buscar a contagem de agendamentos." });
  }
});


// 📌 Calcular lucro
router.get("/profit", authenticateJWT, async (req: AuthRequest, res: Response) => {
  const { period } = req.query;

  if (!period) return res.status(400).json({ message: "Período é obrigatório." });

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { barber: true }
    });

    if (!user || !user.barber) {
      return res.status(403).json({ message: "Acesso negado. Usuário não é um barbeiro." });
    }

    const now = dayjs().tz(TZ);
    let startDate: Date;
    let endDate: Date;

    switch (period) {
      case 'day':
        startDate = now.startOf('day').toDate();
        endDate = now.add(1, 'day').startOf('day').toDate();
        break;
      case 'week':
        startDate = now.startOf('week').toDate();
        endDate = now.endOf('week').add(1, 'second').toDate();
        break;
      case 'month':
        startDate = now.startOf('month').toDate();
        endDate = now.add(1, 'month').startOf('month').toDate();
        break;
      default:
        return res.status(400).json({ message: "Período inválido. Use 'day', 'week' ou 'month'." });
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        barberId: user.barber.id,
        date: { gte: startDate, lt: endDate },
        status: { in: ['SCHEDULED', 'COMPLETED', 'ATTENDED'] }
      },
      include: { services: { include: { service: true } } }
    });

    const totalProfit = appointments.reduce((sum, appointment) => {
      const appointmentTotal = appointment.services.reduce((serviceSum, as) => {
        return serviceSum + as.service.price;
      }, 0);
      return sum + appointmentTotal;
    }, 0);

    res.json({ totalProfit });
  } catch (error) {
    console.error("Erro ao calcular o lucro:", error);
    res.status(500).json({ message: "Erro ao buscar o lucro dos agendamentos." });
  }
});


// 📌 Criar agendamento
router.post("/", authenticateJWT, async (req: AuthRequest, res: Response) => {
  const { date, startTime, endTime, serviceIds } = req.body;

  if (!req.userId || typeof req.userId !== 'string') {
    return res.status(401).json({ message: "Usuário não autenticado." });
  }

  if (!date || !startTime || !endTime || !serviceIds || !Array.isArray(serviceIds)) {
    return res.status(400).json({ message: "Dados obrigatórios: date, startTime, endTime, serviceIds." });
  }

  try {
    const user = await prisma.user.findUnique({ 
      where: { id: req.userId },
      include: { barber: true }
    });
    
    if (!user || !user.barber) { 
      return res.status(401).json({ message: "Usuário não encontrado ou não é um barbeiro." });
    }
    
    const barberId = user.barber.id;

    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds as string[] } },
    });
    if (services.length !== serviceIds.length) {
      return res.status(400).json({ message: "Um ou mais serviços inválidos." });
    }

    const appointmentDate = dayjs(date).startOf('day').toDate();

    const appointment = await prisma.appointment.create({
      data: {
        date: appointmentDate,
        startTime,
        endTime,
        status: AppointmentStatus.SCHEDULED, 
        clientId: user.id,
        barberId: barberId, 
        services: {
          create: services.map((s: { id: string; }) => ({
            service: { connect: { id: s.id } }
          }))
        },
      },
      include: { services: { include: { service: true } } }
    });

    await notifyAppointmentCreated(
      appointment.id,
      barberId,
      user.name,
      appointmentDate,
      startTime
    );

    res.status(201).json(appointment);
  } catch (error: unknown) {
    res.status(500).json({ error: "Erro ao criar agendamento." });
  }
});


// 📌 Atualizar agendamento
router.put("/:id", authenticateJWT, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { date, startTime, endTime, status, serviceIds, barberId } = req.body;
  
   // 1. Log inicial: Dados recebidos na requisição
    console.log("------------------- INÍCIO DA REQUISIÇÃO PUT -------------------");
    console.log(`Recebida requisição PUT para agendamento com ID: ${id}`);
    console.log("Corpo da requisição:", req.body);

  try {
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id },
      include: { services: { include: { service: true } } },
    });
    if (!existingAppointment) {
      console.log(`Erro: Agendamento com ID ${id} não encontrado.`);
      return res.status(404).json({ message: "Agendamento não encontrado." });
    }
    console.log("Agendamento existente encontrado:", existingAppointment);

    const user = await prisma.user.findUnique({ where: { id: req.userId }, include: { barber: true } });
    if (!user || !user.barber || user.barber.id !== existingAppointment.barberId) { 
      console.log(`Erro: Acesso negado para o usuário ${req.userId} no agendamento ${id}.`);
      return res.status(403).json({ message: "Acesso negado. Você não tem permissão para atualizar este agendamento." });
    }

    const updateData: Prisma.AppointmentUpdateInput = {};

    if (date) {
      console.log(`Atualizando data para: ${updateData.date}`);
      updateData.date = dayjs.tz(date, TZ).startOf('day').toDate();
    }
    if (startTime) updateData.startTime = startTime;
     console.log(`Atualizando horário de início para: ${updateData.startTime}`);
    if (endTime) updateData.endTime = endTime;
    console.log(`Atualizando horário de término para: ${updateData.endTime}`);
    

    let statusChangedToCompleted = false;
    let statusChangedToCancelled = false;

    if (status && status !== existingAppointment.status) {
      const newStatus = status as AppointmentStatus; 
      if (newStatus === AppointmentStatus.COMPLETED){ statusChangedToCompleted = true;
        updateData.status = newStatus;
        console.log("Status alterado para: COMPLETED");}
      if (newStatus === AppointmentStatus.CANCELLED) {statusChangedToCancelled = true;
        updateData.status = newStatus;
       console.log("Status alterado para: CANCELLED");
      updateData.status = newStatus;
      }
    }

    if (serviceIds !== undefined && Array.isArray(serviceIds)) {
       console.log("Atualizando serviços. Deletando serviços antigos...");
    await prisma.appointmentService.deleteMany({ where: { appointmentId: id } });
    console.log("Serviços antigos deletados. Criando novos...");
    updateData.services = {
      create: serviceIds.map((s: string) => ({
        service: { connect: { id: s } }
      }))
    };
    console.log("Novos serviços prontos para criação.");
  }

    if (barberId) {
      const barber = await prisma.barber.findUnique({ where: { id: barberId } });
      if (!barber) {
        console.log("Erro: Barbeiro não encontrado.");
        return res.status(400).json({ message: "Barbeiro não encontrado." });
      }
      updateData.barber = { connect: { id: barberId } };
      console.log(`Atualizando barbeiro para: ${barberId}`);
    }
    
    console.log("Dados finais para o update:", updateData);
    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: { services: { include: { service: true } } },
    });
    console.log("Agendamento atualizado com sucesso:", updatedAppointment);
    if (statusChangedToCompleted) {
      console.log("Iniciando a lógica para status 'COMPLETED'...");
      const services = existingAppointment.services.map((s: AppointmentService & { service: Service }) => s.service);
      const total = services.reduce((sum: number, s: Service) => sum + Number(s.price), 0);
       console.log(`Total calculado: ${total}`)

       const barber = await prisma.barber.findUnique({
    where: { id: updatedAppointment.barberId },
    select: { userId: true },
      });

      if (!barber) {
      console.error("Erro: não foi possível encontrar o barbeiro para vincular ao usuário.");
      return res.status(400).json({ message: "Barbeiro não encontrado para vínculo financeiro." });
      }
    
       console.log("Tentando criar o registro financeiro...");
      await prisma.financialRecord.create({
        data: {
          type: "income",
          amount: total,
          description: `Receita de agendamento #${updatedAppointment.id}`,
          date: updatedAppointment.date,
          category: "Serviço",
          userId: barber.userId,
          appointmentId: updatedAppointment.id,
        },
      });console.log("Registro financeiro criado.");

      console.log("Tentando enviar a notificação 'Completed'...");
      await notifyAppointmentCompleted(
        updatedAppointment.id,
        updatedAppointment.barberId,
        updatedAppointment.clientName || 'Cliente',
        total
      );console.log("Notificação 'Completed' enviada com sucesso.");
    }

    if (statusChangedToCancelled) {
      console.log("Iniciando a lógica para status 'CANCELLED'...");
      await prisma.financialRecord.deleteMany({
        where: { appointmentId: updatedAppointment.id, type: "income" },
      });console.log("Registros financeiros de agendamento cancelado removidos.");

      await notifyAppointmentCancelled(
        updatedAppointment.id,
        updatedAppointment.barberId,
        updatedAppointment.clientName || 'Cliente',
        updatedAppointment.date,
        updatedAppointment.startTime
      );
      console.log("Notificação 'Cancelled' enviada com sucesso.");
    }

    if (!statusChangedToCompleted && !statusChangedToCancelled) {
      console.log("Iniciando a lógica para atualização padrão...");
      await notifyAppointmentUpdated(
        updatedAppointment.id,
        updatedAppointment.barberId,
        updatedAppointment.clientName || 'Cliente',
        updatedAppointment.date,
        updatedAppointment.startTime
      );console.log("Notificação 'Updated' enviada com sucesso.");
    }

    res.json(updatedAppointment);
    console.log("------------------- FIM DA REQUISIÇÃO PUT -------------------");
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      console.error("ERRO na requisição PUT:", error);
      return res.status(404).json({ message: "Agendamento não encontrado." });
    }
    console.log("------------------- FIM DA REQUISIÇÃO PUT (COM ERRO) -------------------");
    res.status(500).json({ error: "Erro ao atualizar agendamento." });
  }
});


// 📌 Deletar agendamento
router.delete("/:id", authenticateJWT, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const existingAppointment = await prisma.appointment.findUnique({ where: { id } });
    if (!existingAppointment) {
      return res.status(404).json({ message: "Agendamento não encontrado." });
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId }, include: { barber: true } });
    if (!user || !user.barber || user.barber.id !== existingAppointment.barberId) {
      return res.status(403).json({ message: "Acesso negado. Você não tem permissão para deletar este agendamento." });
    }

    await prisma.appointment.delete({ where: { id } });
    res.json({ message: "Agendamento removido." });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return res.status(404).json({ message: "Agendamento não encontrado." });
    }
    res.status(500).json({ error: "Erro ao deletar agendamento." });
  }
});


export default router;
