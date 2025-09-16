import { Router, Request, Response } from "express";
import prisma from "../prisma";
import { pushSubscriptions } from './notification';
import webpush from 'web-push';
import { Prisma, Service, AppointmentService, Appointment, AppointmentStatus } from '@prisma/client';
//middleware
import { authenticateJWT, AuthRequest } from "../middleware/auth";
const router = Router();


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

    // Handle date filtering
    if (date) {
      // For specific date, create a date range for that day
      const specificDate = new Date(date as string);
      const startOfDay = new Date(specificDate.getFullYear(), specificDate.getMonth(), specificDate.getDate());
      const endOfDay = new Date(specificDate.getFullYear(), specificDate.getMonth(), specificDate.getDate() + 1);

      where.date = {
        gte: startOfDay,
        lt: endOfDay,
      };
    } else if (period && period !== 'all') {
      const now = new Date();
      let startDate: Date;
      let endDate: Date;

      switch (period) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
          break;
        case 'week':
          const dayOfWeek = now.getDay();
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (6 - dayOfWeek) + 1);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          break;
        default:
          return res.status(400).json({ message: "Período inválido. Use 'all', 'today', 'week' ou 'month'." });
      }

      where.date = {
        gte: startDate,
        lt: endDate,
      };
    }
    // If period is 'all' or no period/date is specified, don't apply date filtering

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
      orderBy: {
        date: 'asc',
      },
    });
    res.json(appointments);
  } catch (error: unknown) {
    res.status(500).json({ error: "Erro ao listar agendamentos." });
  }
});

// Rota para buscar horários disponíveis
router.get("/available",authenticateJWT, async (req: AuthRequest, res: Response) => {
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

    const selectedDate = new Date(String(date));
    selectedDate.setHours(0, 0, 0, 0);

    const barberInfo = await prisma.personalInformation.findUnique({
      where: { userId: barberId as string },
    });
    const workStart = barberInfo?.startTime ? parseFloat(barberInfo.startTime) : 8;
    const workEnd = barberInfo?.endTime ? parseFloat(barberInfo.endTime) : 18;
    const serviceDurationMinutes = service.duration;
    const serviceDurationHours = serviceDurationMinutes / 60;
    
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

    // **2. Buscar AGENDAMENTOS e BLOQUEIOS para o dia**
    const [appointments, blockedBlocks] = await Promise.all([
      prisma.appointment.findMany({
        where: {
          barberId: barberId as string,
          date: selectedDate,
        },
      }),
      prisma.availabilityBlock.findMany({
        where: {
          barberId: barberId as string,
          date: selectedDate,
        },
      }),
    ]);

    // Combine os horários ocupados (agendamentos + bloqueios)
    const occupiedSlots = [...appointments, ...blockedBlocks];

    // **3. Filtrar os horários disponíveis**
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


// rota para contar os agendamentos
router.get("/count", authenticateJWT, async (req: AuthRequest, res: Response) => {
  const { period } = req.query;

  if (!period) {
    return res.status(400).json({ message: "Período é obrigatório." });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { barber: true }
    });

    if (!user || !user.barber) {
      return res.status(403).json({ message: "Acesso negado. Usuário não encontrado ou não é um barbeiro." });
    }

    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'week':
        const day = now.getDay();
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      default:
        return res.status(400).json({ message: "Período inválido. Use 'day', 'week' ou 'month'." });
    }

    const count = await prisma.appointment.count({
      where: {
        barberId: user.barber.id,
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
    });

    res.json({ count });
  } catch (error) {
    console.error("Erro ao contar agendamentos:", error);
    res.status(500).json({ message: "Erro ao buscar a contagem de agendamentos." });
  }
});
// No seu arquivo de rotas de agendamentos 

router.get("/profit", authenticateJWT, async (req: AuthRequest, res: Response) => {
    const { period } = req.query;

    if (!period) {
        return res.status(400).json({ message: "Período é obrigatório." });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            include: { barber: true }
        });

        if (!user || !user.barber) {
            return res.status(403).json({ message: "Acesso negado. Usuário não é um barbeiro." });
        }

        const now = new Date();
        let startDate: Date;
        let endDate: Date;

        switch (period) {
            case 'day':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
                break;
            case 'week':
                const day = now.getDay();
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
                endDate = new Date(startDate);
                endDate.setDate(endDate.getDate() + 7);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                break;
            default:
                return res.status(400).json({ message: "Período inválido. Use 'day', 'week' ou 'month'." });
        }

        const appointments = await prisma.appointment.findMany({
            where: {
                barberId: user.barber.id,
                date: {
                    gte: startDate,
                    lt: endDate,
                },
                status: {
                    in: ['SCHEDULED', 'COMPLETED', 'ATTENDED'] 
                }
            },
            include: {
                services: {
                    include: {
                        service: true
                    }
                }
            }
        });

        // Calcula o lucro total somando os preços dos serviços de cada agendamento
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

// Rota para obter um agendamento específico
router.get("/:id", authenticateJWT, async (req: AuthRequest, res: Response) => {
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

    const appointment = await prisma.appointment.create({
      data: {
        date: new Date(date),
        startTime,
        endTime,
        status: AppointmentStatus.SCHEDULED, 
        clientId: user.id,
        barberId: barberId, 
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
router.put("/:id", authenticateJWT, async (req: AuthRequest, res: Response) => {
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
    if (!user || !user.barber || user.barber.id !== existingAppointment.barberId) { 
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
      
  const barberUserId = updatedAppointment.barberId;

      await prisma.financialRecord.create({
        data: {
          type: "income",
          amount: new Prisma.Decimal(total),
          description: `Receita de agendamento #${updatedAppointment.id}`,
          date: updatedAppointment.date,
          category: "Serviço",
           userId: updatedAppointment.barberId,
        appointmentId: updatedAppointment.id,
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
router.delete("/:id", authenticateJWT, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const existingAppointment = await prisma.appointment.findUnique({ where: { id } });
    if (!existingAppointment) {
      return res.status(404).json({ message: "Agendamento não encontrado." });
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId }, include: { barber: true } });
    if (!user || !user.barber || user.barber.id !== existingAppointment.barberId) { // Verificação para evitar o erro 'possibly null'
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
