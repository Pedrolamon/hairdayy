import { Router, Request, Response } from 'express';
import prisma from '../prisma';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { Prisma, AppointmentService } from '@prisma/client';


const router = Router();

// Esta rota substitui a lógica do seu arquivo anterior em TypeORM.
router.get('/', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    // Definir as datas de filtro
    const { start, end, barberId } = req.query;
    const now = end ? new Date(String(end)) : new Date();
    const startDate = start ? new Date(String(start)) : new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);

    // Preparar o filtro para as queries do Prisma
    const appointmentsWhere: Prisma.AppointmentWhereInput = {
      date: {
        gte: startDate,
        lte: now,
      },
      ...(barberId && { barberId: barberId as string }),
    };

    // --- Buscar dados com Prisma ---
    
    // Buscar agendamentos com relações, incluindo o usuário do barbeiro
    const appointments = await prisma.appointment.findMany({
      where: appointmentsWhere,
      include: {
        barber: {
          include: {
            user: true, // Adicionada a inclusão do usuário
          },
        },
        services: {
          include: {
            service: true,
          },
        },
      },
    });

    // Buscar vendas
    const sales = await prisma.sale.findMany({
      where: {
        date: {
          gte: startDate,
          lte: now,
        },
      },
      include: {
        products: {
          include: {
            product: true
          }
        }
      }
    });

    // Buscar registros financeiros
    const financialRecords = await prisma.financialRecord.findMany({
      where: {
        date: {
          gte: startDate,
          lte: now,
        },
        ...(barberId && { appointment: { barberId: barberId as string } }),
      }
    });

    // --- Cálculos e agregação de dados ---

    // Totais
    type FinancialRecordWithRelations = (typeof financialRecords)[number];
    type SaleWithRelations = (typeof sales)[number];
    // Atualizado para incluir o tipo User na relação do Barber
    type AppointmentWithRelations = (typeof appointments)[number] & { barber: { user: { name: string } } };
    
    const totalAppointments = appointments.length;
    const totalSales = sales.length;
    const totalProductsSold = sales.reduce((sum: number, s: SaleWithRelations) => {
      // O campo quantities é um JSON, então precisamos iterar sobre ele
      if (s.quantities) {
        const quantities = s.quantities as Record<string, number>;
        return sum + Object.values(quantities).reduce((a: number, b: number) => a + b, 0);
      }
      return sum;
    }, 0);

    const totalFinancial = financialRecords.reduce((sum: number, f: FinancialRecordWithRelations) => sum + f.amount.toNumber(), 0);
    const totalSalesValue = sales.reduce((sum: number, s: SaleWithRelations) => sum + (s.total || 0), 0);
    const totalRevenue = totalFinancial + totalSalesValue;

    // Top serviços (Top 5)
    const serviceCount: { [name: string]: number } = {};
    appointments.forEach((a: AppointmentWithRelations) => {
      a.services.forEach((s: AppointmentService & { service: { name: string } }) => {
        const serviceName = s.service.name;
        serviceCount[serviceName] = (serviceCount[serviceName] || 0) + 1;
      });
    });
    const topServices = Object.entries(serviceCount).sort(([, a], [, b]) => b - a).slice(0, 5);

    // Top barbeiros (Top 5)
    const barberCount: { [name: string]: number } = {};
    appointments.forEach((a: AppointmentWithRelations) => {
      if (a.barber && a.barber.user) { // Acessa o nome do usuário através do barbeiro
        barberCount[a.barber.user.name] = (barberCount[a.barber.user.name] || 0) + 1;
      }
    });
    const topBarbers = Object.entries(barberCount).sort(([, a], [, b]) => b - a).slice(0, 5);

    // Gráfico: agendamentos por dia
    const appointmentsByDay: { [date: string]: number } = {};
    appointments.forEach((a: AppointmentWithRelations) => {
      const dateString = a.date.toISOString().slice(0, 10);
      appointmentsByDay[dateString] = (appointmentsByDay[dateString] || 0) + 1;
    });

    // Gráfico: vendas por dia
    const salesByDay: { [date: string]: number } = {};
    sales.forEach((s: SaleWithRelations) => {
      const dateString = s.date.toISOString().slice(0, 10);
      salesByDay[dateString] = (salesByDay[dateString] || 0) + 1;
    });

    res.json({
      totalAppointments,
      totalSales,
      totalProductsSold,
      totalRevenue,
      topServices,
      topBarbers,
      appointmentsByDay,
      salesByDay,
    });

  } catch (error: unknown) {
    console.error(error);
    res.status(500).json({ error: "Erro ao gerar relatório do dashboard." });
  }
});

export default router;