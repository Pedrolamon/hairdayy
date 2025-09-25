import { Router, Request, Response } from "express";
import prisma from "../prisma";
import { AuthRequest } from "../middleware/auth";
import { pushSubscriptions } from './notification';
import webpush from 'web-push';
import { Prisma, Service, AppointmentService, Appointment, AppointmentStatus } from '@prisma/client';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
dayjs.extend(utc);
dayjs.extend(timezone);

const TZ = process.env.TIMEZONE || 'America/Sao_Paulo';


const router = Router();


router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ 
      where: { id: req.userId },
      include: { barber: true }
    });

    if (!user || !user.barber) { 
      return res.status(403).json({ message: "Acesso negado. Usuário não encontrado." });
    }

    const { clientId } = req.query;
    const where: Prisma.AppointmentWhereInput = {
      barberId: user.barber.id, 
    };

    
    if (clientId) {
      where.clientId = clientId as string;
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        client: true,
        barber: {
          include: {
            user: true,
          },
        },
        services: {
          include: {
            service: true,
          },
        },
      },
    });
    res.json(appointments);
  } catch (error: unknown) {
    res.status(500).json({ error: "Erro ao listar agendamentos." });
  }
});

router.get("/open", async (req: Request, res: Response) => {
  const { serviceId, barberId, date } = req.query;

  if (!serviceId || !barberId || !date) {
    console.log("Parâmetros faltando:", { serviceId, barberId, date });
    return res.status(400).json({ message: "serviceId, barberId e date são obrigatórios." });
  }

  try {
    // Buscar serviço
    const service = await prisma.service.findUnique({ where: { id: serviceId as string } });
    if (!service) return res.status(404).json({ message: "Serviço não encontrado." });
    console.log("Serviço encontrado:", service);

    // Buscar barbeiro
    const barber = await prisma.barber.findUnique({ where: { id: barberId as string } });
    if (!barber) return res.status(404).json({ message: "Barbeiro não encontrado." });
    console.log("Barbeiro encontrado:", barber);

    // Buscar horários do barbeiro
    const barberInfo = await prisma.personalInformation.findUnique({ where: { userId: barber.userId } });
    if (!barberInfo || !barberInfo.startTime || !barberInfo.endTime) {
      return res.status(404).json({ message: "Horário de trabalho do barbeiro não está definido." });
    }
    console.log("Horário do barbeiro:", barberInfo.startTime, "-", barberInfo.endTime);

    // Converter horários para float
    const [startHour, startMinute] = barberInfo.startTime.split(':').map(Number);
    const [endHour, endMinute] = barberInfo.endTime.split(':').map(Number);
    const workStart = startHour + startMinute / 60;
    const workEnd = endHour + endMinute / 60;
    console.log('Horário de trabalho convertido (float):', { workStart, workEnd });

    const serviceDurationHours = service.duration / 60;
    console.log('Duração do serviço (horas):', serviceDurationHours);

    // Gerar slots do dia
    const slots: string[] = [];
    for (let hour = workStart; hour <= workEnd - serviceDurationHours; hour += serviceDurationHours) {
      const startMinutes = Math.floor(hour * 60);
      const endMinutes = Math.floor((hour + serviceDurationHours) * 60);
      const start = `${Math.floor(startMinutes / 60).toString().padStart(2, '0')}:${(startMinutes % 60).toString().padStart(2, '0')}`;
      const end = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;
      slots.push(`${start}-${end}`);
    }
    console.log('Slots gerados (antes da filtragem):', slots);

    // Buscar agendamentos e bloqueios
    const [appointments, blockedBlocks] = await Promise.all([
  prisma.appointment.findMany({
    where: { 
      barberId: barberId as string, 
      date: dayjs(date as string).tz(TZ).startOf('day').toDate()
    },
  }),
  prisma.availabilityBlock.findMany({
    where: { 
      barberId: barberId as string, 
      date: dayjs(date as string).tz(TZ).startOf('day').toDate()
    },
  }),
]);
    console.log('Agendamentos encontrados:', appointments);
    console.log('Bloqueios encontrados:', blockedBlocks);

    // Converter "HH:MM" em minutos
    const timeToMinutes = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };

    // Criar array de slots ocupados em minutos
    const occupiedSlots: [number, number][] = [
      ...appointments.map(a => {
        let start: string, end: string;
        if (a.startTime.includes('-')) {
          [start, end] = a.startTime.split('-');
        } else {
          start = a.startTime;
          end = a.endTime;
        }
        return [timeToMinutes(start), timeToMinutes(end)] as [number, number];
      }),
      ...blockedBlocks.map(b => [timeToMinutes(b.startTime), timeToMinutes(b.endTime)] as [number, number]),
    ];
    console.log('Slots ocupados (em minutos):', occupiedSlots);

    // Filtrar slots ocupados
    let availableSlots = slots.filter(slot => {
      const [slotStart, slotEnd] = slot.split('-').map(timeToMinutes);
      return !occupiedSlots.some(([occStart, occEnd]) => slotStart < occEnd && slotEnd > occStart);
    });
    console.log('Slots disponíveis após filtrar ocupados:', availableSlots);

    // Filtrar slots que já passaram (só se for hoje)
    const now = new Date();
    const [year, month, day] = (date as string).split('-').map(Number);
    const isToday = year === now.getFullYear() && month === now.getMonth() + 1 && day === now.getDate();

    console.log('Data requisitada:', date, 'Hoje:', now.toLocaleDateString(), 'isToday:', isToday);

    if (isToday) {
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      availableSlots = availableSlots.filter(slot => {
        const [slotStart, slotEnd] = slot.split('-').map(timeToMinutes);
        return slotEnd > currentMinutes; // mantém apenas os que ainda não terminaram
      });
      console.log('Slots disponíveis após filtrar horários passados:', availableSlots);
    }

    res.json(availableSlots);
  } catch (error) {
    console.error("Erro ao buscar horários disponíveis:", error);
    res.status(500).json({ error: "Erro ao buscar horários disponíveis." });
  }
});


// Rota para obter datas disponíveis baseadas nas informações pessoais do barbeiro
router.get("/available-dates", async (req: Request, res: Response) => {
  const { barberId } = req.query;

  if (!barberId) {
    return res.status(400).json({ message: "barberId é obrigatório." });
  }

  try {
    // Buscar informações pessoais do barbeiro
    const barber = await prisma.barber.findUnique({
      where: { id: barberId as string },
      include: { user: { include: { personalInfo: true } } }
    });

    if (!barber) {
      return res.status(404).json({ message: "Barbeiro não encontrado." });
    }

    if (!barber.user) {
      return res.status(404).json({ message: "Usuário do barbeiro não encontrado." });
    }

    if (!barber.user.personalInfo) {
      return res.status(404).json({ message: "Informações pessoais não encontradas." });
    }

    const personalInfo = barber.user.personalInfo;
    const daysWorked = personalInfo.daysworked ? parseInt(personalInfo.daysworked) :
    personalInfo.workDays ? personalInfo.workDays : 30; // Default 30 dias
    const availableDays = personalInfo.availableDays as string[] || ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    const today = new Date();
    const availableDates = [];
     
    // Gerar datas disponíveis nos próximos X dias
    for (let i = 0; i < daysWorked; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const dayOfWeek = date.toLocaleDateString('pt-BR', { weekday: 'short' });
      const dayOfWeekCapitalized = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);
      // Remover o ponto final se existir
      const dayOfWeekClean = dayOfWeekCapitalized.replace('.', '');

      // Verificar se o dia da semana está disponível
      if (availableDays.includes(dayOfWeekClean)) {
        availableDates.push({
          date: date.toISOString().split('T')[0], // Formato YYYY-MM-DD
          dayOfWeek: dayOfWeekCapitalized,
          day: date.getDate(),
          month: date.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase(),
          fullDate: date.toLocaleDateString('pt-BR')
        });
      }
    }

    res.json(availableDates);
  } catch (error: unknown) {
    console.error("Erro ao buscar datas disponíveis:", error);
    res.status(500).json({ error: "Erro ao buscar datas disponíveis." });
  }
});

// Rota para obter agendamentos por telefone
router.get("/by-phone", async (req: Request, res: Response) => {
  const { phone } = req.query;
  if (!phone) {
    return res.status(400).json({ message: "Telefone é obrigatório." });
  }
  try {
    const appointments = await prisma.appointment.findMany({
      where: { phone: phone as string },
      include: {
        client: true,
        barber: {
          include: {
            user: true,
          },
        },
        services: {
          include: {
            service: true,
          },
        },
      },
      orderBy: { date: 'desc' }, // Mais recente primeiro
    });
    res.json(appointments);
  } catch (error: unknown) {
    res.status(500).json({ error: "Erro ao obter agendamentos." });
  }
});


// Rota para obter um agendamento específico
router.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        client: true,
        barber: {
          include: {
            user: true,
          },
        },
        services: {
          include: {
            service: true,
          },
        },
      },
    });
    if (!appointment) {
      return res.status(404).json({ message: "Agendamento não encontrado." });
    }
    res.json(appointment);
  } catch (error: unknown) {
    res.status(500).json({ error: "Erro ao obter agendamento." });
  }
});

// Rota para criar um novo agendamento
router.post("/", async (req: Request, res: Response) => { 
    const { date, startTime, endTime, serviceIds, clientName, phone, barberId, clientId } = req.body;

    console.log("1. Dados recebidos da requisição:", { date, startTime, endTime });

    if (!date || !startTime || !endTime || !serviceIds || !Array.isArray(serviceIds) || !barberId) {
        return res.status(400).json({ message: "Dados obrigatórios: date, startTime, endTime, serviceIds, barberId." });
    }

     
    
    try {
        // Validação do barbeiro para garantir que ele existe
        const barber = await prisma.barber.findUnique({ where: { id: barberId } });
        if (!barber) {
            return res.status(404).json({ message: "Barbeiro não encontrado." });
        }

        const services = await prisma.service.findMany({
            where: { id: { in: serviceIds as string[] } },
        });
        if (services.length !== serviceIds.length) {
            return res.status(400).json({ message: "Um ou mais serviços inválidos." });
        }
        const appointmentDate = dayjs.tz(date as string, TZ).startOf('day').toDate();

        console.log("2. Data convertida para fuso horário local:", appointmentDate);
        const appointment = await prisma.appointment.create({
            data: {
                date: appointmentDate,
                startTime,
                endTime,
                status: AppointmentStatus.SCHEDULED, 
                barberId: barberId,
                clientName: clientName || null, 
                phone: phone || null,
                clientId: clientId || null, 
                services: {
                    create: services.map((s: { id: string; }) => ({
                        service: {
                            connect: { id: s.id }
                        }
                    }))
                },
            },
            include: {
                services: {
                    include: {
                        service: true
                    }
                }
            }
        });
        console.log("Resposta da API para o Frontend:", appointment);
        const user = await prisma.user.findUnique({ 
          where: { id: barber.userId } 
        });

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
    } catch (error: unknown) {
        res.status(500).json({ error: "Erro ao criar agendamento." });
    }
});


// Rota para deletar um agendamento
router.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const existingAppointment = await prisma.appointment.findUnique({ where: { id } });
    if (!existingAppointment) {
      return res.status(404).json({ message: "Agendamento não encontrado." });
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
