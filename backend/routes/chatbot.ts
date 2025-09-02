import { Router, Request, Response } from "express";
import prisma from "../prisma";
import { AuthRequest } from "../middleware/auth";
import { pushSubscriptions } from './notification';
import webpush from 'web-push';
import { Prisma, Service, AppointmentService, Appointment, AppointmentStatus } from '@prisma/client';


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

// Rota para buscar horários disponíveis
router.get("/open", async (req: Request, res: Response) => {
  const { serviceId, barberId, date } = req.query;

  if (!serviceId || !barberId || !date) {
    return res.status(400).json({ message: "serviceId, barberId e date são obrigatórios." });
  }

  try {
    const service = await prisma.service.findUnique({
      where: { id: serviceId as string },
    });
    if (!service) {
      return res.status(404).json({ message: "Serviço não encontrado." });
    }

    const workStart = 6;
    const workEnd = 18;
    const slots: string[] = [];
    const serviceDurationHours = service.duration / 60;

    for (let hour = workStart; hour <= workEnd - serviceDurationHours; hour += 0.5) {
      const start = `${Math.floor(hour).toString().padStart(2, '0')}:${(hour % 1 === 0.5 ? '30' : '00')}`;
      const endHour = hour + serviceDurationHours;
      const end = `${Math.floor(endHour).toString().padStart(2, '0')}:${(endHour % 1 === 0.5 ? '30' : '00')}`;
      slots.push(`${start}-${end}`);
    }

    const appointments: Appointment[] = await prisma.appointment.findMany({
      where: {
        barberId: barberId as string,
        date: new Date(String(date)),
      },
    });

    const availableSlots = slots.filter(slot => {
      const [start, end] = slot.split('-');
      return !appointments.some((app: Appointment) =>
        (start >= app.startTime && start < app.endTime) ||
        (end > app.startTime && end <= app.endTime) ||
        (start < app.startTime && end > app.endTime)
      );
    });

    res.json(availableSlots);
  } catch (error: unknown) {
    res.status(500).json({ error: "Erro ao buscar horários disponíveis." });
  }
});


// Rota para obter um agendamento específico
router.get("/:id", async (req: AuthRequest, res: Response) => {
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

        const appointment = await prisma.appointment.create({
            data: {
                date: new Date(date),
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

// Rota para atualizar um agendamento existente
router.put("/:id", async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { date, startTime, endTime, status, serviceIds, barberId } = req.body;
  
  try {
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id },
      include: { services: { include: { service: true } } },
    });
    if (!existingAppointment) {
      return res.status(404).json({ message: "Agendamento não encontrado." });
    }

    
    const user = await prisma.user.findUnique({ where: { id: req.userId }, include: { barber: true } });
    if (!user || !user.barber || user.barber.id !== existingAppointment.barberId) { // Verificação para evitar o erro 'possibly null'
      return res.status(403).json({ message: "Acesso negado. Você não tem permissão para atualizar este agendamento." });
    }

    const updateData: Prisma.AppointmentUpdateInput = {};

    if (date) {
      updateData.date = new Date(date);
    }
    if (startTime) {
      updateData.startTime = startTime;
    }
    if (endTime) {
      updateData.endTime = endTime;
    }

    let statusChangedToCompleted = false;
    let statusChangedToCancelled = false;

    if (status && status !== existingAppointment.status) {
      const newStatus = status as AppointmentStatus; 
      if (newStatus === AppointmentStatus.COMPLETED) {
        statusChangedToCompleted = true;
      }
      if (newStatus === AppointmentStatus.CANCELLED) {
        statusChangedToCancelled = true;
      }
      updateData.status = newStatus;
    }

    if (serviceIds && Array.isArray(serviceIds)) {
      await prisma.appointmentService.deleteMany({ where: { appointmentId: id } });
      updateData.services = {
        create: serviceIds.map((s: string) => ({
          service: {
            connect: { id: s }
          }
        }))
      };
    }

    if (barberId) {
      const barber = await prisma.barber.findUnique({ where: { id: barberId } });
      if (!barber) {
        return res.status(400).json({ message: "Barbeiro não encontrado." });
      }
      updateData.barber = { connect: { id: barberId } };
    }
    

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: { services: { include: { service: true } } },
    });

    if (statusChangedToCompleted) {
      const services = existingAppointment.services.map((s: AppointmentService & { service: Service }) => s.service);
      const total = services.reduce((sum: number, s: Service) => sum + Number(s.price), 0);
      
      await prisma.financialRecord.create({
        data: {
          type: "income",
          amount: new Prisma.Decimal(total),
          description: `Receita de agendamento #${updatedAppointment.id}`,
          date: updatedAppointment.date,
          category: "Serviço",
          appointment: { connect: { id: updatedAppointment.id } },
        },
      });
    }

    if (statusChangedToCancelled) {
      await prisma.financialRecord.deleteMany({
        where: {
          appointmentId: updatedAppointment.id,
          type: "income"
        },
      });
    }

    res.json(updatedAppointment);
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return res.status(404).json({ message: "Agendamento não encontrado." });
    }
    res.status(500).json({ error: "Erro ao atualizar agendamento." });
  }
});

// Rota para deletar um agendamento
router.delete("/:id", async (req: AuthRequest, res: Response) => {
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
    console.log("carralho de erro", error)
    res.status(500).json({ error: "Erro ao deletar agendamento." });
  }
});

export default router;