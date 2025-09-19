import { Router, Response } from 'express';
import prisma from '../prisma';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { Prisma, AppointmentService } from '@prisma/client';

const router = Router();

/** Helpers */
const isNonEmpty = (v: unknown) => typeof v === 'string' && v.trim() !== '';
const parseISODate = (v?: unknown): Date | null => {
  if (!isNonEmpty(String(v ?? ''))) return null;
  const t = Date.parse(String(v));
  return isNaN(t) ? null : new Date(t);
};
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
const toNumber = (v: any): number =>
  typeof v === 'number' ? v : v?.toNumber?.() ?? Number(v ?? 0);

/** GET /dashboard */
router.get('/', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { barber: true, clientAppointments: true }
    });

    if (!user) {
      return res.status(403).json({ message: "Acesso negado. Usuário não encontrado." });
    }

    // 🎯 Lógica de controle de acesso para a rota do dashboard
    if (user.role === 'CLIENT') {
      return res.status(403).json({ message: "Acesso negado. Clientes não podem visualizar o dashboard." });
    }
    const { start, end, barberId, clientPeriod } = req.query;

    const endParam = parseISODate(end) ?? new Date();
    const now = endOfDay(endParam);

    const startParam = parseISODate(start);
    const startDate = startOfDay(
      startParam ?? new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29)
    );

    let finalBarberFilter: Prisma.AppointmentWhereInput = {};
    let finalFinancialRecordFilter: Prisma.FinancialRecordWhereInput = {};

    // 1. Se o usuário é um BARBEIRO, ele só pode ver os próprios dados
    if (user.role === 'BARBER' && user.barber) {
      finalBarberFilter.barberId = user.barber.id;
      finalFinancialRecordFilter = {
        OR: [
          { appointment: { barberId: user.barber.id } }, // Registros de agendamentos
          { userId: user.id } // Outros registros criados pelo barbeiro
        ]
      };
    }
    // 2. Se o usuário é um ADMIN, ele pode filtrar por barbeiro
    else if (user.role === 'ADMIN' && isNonEmpty(String(barberId ?? ''))) {
      finalBarberFilter.barberId = String(barberId);
      finalFinancialRecordFilter.appointment = { barberId: String(barberId) };
    }



    const appointments = await prisma.appointment.findMany({
      where: {
        date: { gte: startDate, lte: now },
        ...finalBarberFilter,
      },
      include: {
        barber: { include: { user: true } },
        services: { include: { service: true },  },
      },
    });

    const sales = await prisma.sale.findMany({
      where: { date: { gte: startDate, lte: now },  userId: user.id,  },
      include: {
        products: { include: { product: true } },
      },
    });

    const financialRecords = await prisma.financialRecord.findMany({
      where: {
        date: { gte: startDate, lte: now }, ...finalFinancialRecordFilter,
        ...(isNonEmpty(String(barberId ?? ''))
          ? { appointment: { barberId: String(barberId) } }
          : {}),
      },
    });

    type AppointmentWithRelations = (typeof appointments)[number] & {
      barber?: { user?: { name?: string | null } | null } | null;
    };
    type SaleWithRelations = (typeof sales)[number];
    type FinancialRecordWithRelations = (typeof financialRecords)[number];

    const totalAppointments = appointments.length;
    const totalSales = sales.length;

    const totalProductsSold = sales.reduce((sum: number, s: SaleWithRelations) => {
      const raw = (s as any).quantities;
      const obj =
        raw == null
          ? {}
          : typeof raw === 'string'
          ? (JSON.parse(raw) as Record<string, number>)
          : (raw as Record<string, number>);
      const qtd = Object.values(obj).reduce((a, b) => a + Number(b || 0), 0);
      return sum + qtd;
    }, 0);

    const totalFinancial = financialRecords.reduce(
      (sum: number, f: FinancialRecordWithRelations) => sum + toNumber(f.amount),
      0
    );
    const totalSalesValue = sales.reduce(
      (sum: number, s: SaleWithRelations) => sum + toNumber((s as any).total),
      0
    );
    const totalRevenue = totalFinancial + totalSalesValue;

    // Top serviços
    const serviceCount: Record<string, number> = {};
    appointments.forEach((a: AppointmentWithRelations) => {
      a.services.forEach((s: AppointmentService & { service: { name: string } }) => {
        const name = s.service?.name ?? 'Sem nome';
        serviceCount[name] = (serviceCount[name] || 0) + 1;
      });
    });
    const topServices = Object.entries(serviceCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    // Top barbeiros
    const barberCount: Record<string, number> = {};
    appointments.forEach((a: AppointmentWithRelations) => {
      const name = a.barber?.user?.name ?? 'Sem barbeiro';
      barberCount[name] = (barberCount[name] || 0) + 1;
    });
    const topBarbers = Object.entries(barberCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    // Séries por dia
    const appointmentsByDay: Record<string, number> = {};
    appointments.forEach((a) => {
      const key = a.date.toISOString().slice(0, 10);
      appointmentsByDay[key] = (appointmentsByDay[key] || 0) + 1;
    });

    const salesByDay: Record<string, number> = {};
    sales.forEach((s) => {
      const key = s.date.toISOString().slice(0, 10);
      salesByDay[key] = (salesByDay[key] || 0) + 1;
    });

    // 🆕 Métricas de Clientes
    const currentMonth = new Date();
    let clientAnalysisStartDate: Date;
    let clientAnalysisEndDate: Date;

    // Determinar período de análise de clientes baseado no filtro
    switch (clientPeriod) {
      case 'last_month':
        clientAnalysisStartDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
        clientAnalysisEndDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0, 23, 59, 59, 999);
        break;
      case 'last_3_months':
        clientAnalysisStartDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 3, 1);
        clientAnalysisEndDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'last_6_months':
        clientAnalysisStartDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 6, 1);
        clientAnalysisEndDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'last_year':
        clientAnalysisStartDate = new Date(currentMonth.getFullYear() - 1, currentMonth.getMonth(), 1);
        clientAnalysisEndDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'all_time':
        clientAnalysisStartDate = new Date(2020, 0, 1); // Data muito antiga
        clientAnalysisEndDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      default: // 'current_month'
        clientAnalysisStartDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        clientAnalysisEndDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    // Novos clientes no período selecionado
    const newClientsThisMonth = await prisma.appointment.findMany({
      where: {
        date: { gte: clientAnalysisStartDate, lte: clientAnalysisEndDate },
        ...finalBarberFilter,
      },
      select: {
        clientId: true,
        clientName: true,
        date: true,
      },
      distinct: ['clientId'],
    });

    // Clientes recorrentes (com mais de 1 agendamento)
    const clientAppointmentCounts = await prisma.appointment.groupBy({
      by: ['clientId', 'clientName'],
      where: {
        date: { gte: startDate, lte: now },
        ...finalBarberFilter,
        clientId: { not: null },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    // Filtrar apenas clientes recorrentes (mais de 1 agendamento)
    const recurringClients = clientAppointmentCounts
      .filter(client => client._count.id > 1)
      .map(client => ({
        clientId: client.clientId,
        clientName: client.clientName || 'Cliente Anônimo',
        appointmentCount: client._count.id,
      }));

    // Top 10 clientes mais fiéis
    const topLoyalClients = recurringClients.slice(0, 10);

    // Estatísticas de clientes
    
    const totalUniqueClients = await prisma.appointment.findMany({
      where: {
        date: { gte: startDate, lte: now },
        ...finalBarberFilter,
        clientId: { not: null },
      },
      distinct: ['clientId'],
      select: { clientId: true },
    });

    const newClientsCount = newClientsThisMonth.length;
    const recurringClientsCount = recurringClients.length;

    res.json({
      totalAppointments,
      totalSales,
      totalProductsSold,
      totalRevenue,
      topServices,
      topBarbers,
      appointmentsByDay,
      salesByDay,
      // 🆕 Novas métricas de clientes
      clientMetrics: {
        totalUniqueClients,
        newClientsThisMonth: newClientsCount,
        recurringClients: recurringClientsCount,
        topLoyalClients,
        newClientsList: newClientsThisMonth.map(client => ({
          clientId: client.clientId,
          clientName: client.clientName || 'Cliente Anônimo',
          firstAppointmentDate: client.date,
        })),
        periodInfo: {
          startDate: clientAnalysisStartDate,
          endDate: clientAnalysisEndDate,
          period: clientPeriod || 'current_month',
        },
      },
    });
  } catch (error) {
    console.error('[GET /dashboard] erro:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório do dashboard.' });
  }
});

export default router;
