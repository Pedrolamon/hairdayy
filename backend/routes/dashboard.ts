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
    const { start, end, barberId } = req.query;

    const endParam = parseISODate(end) ?? new Date();
    const now = endOfDay(endParam);

    const startParam = parseISODate(start);
    const startDate = startOfDay(
      startParam ?? new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29)
    );

   
    const barberFilter =
      isNonEmpty(String(barberId ?? '')) ? { barberId: String(barberId) } : {};

    const appointments = await prisma.appointment.findMany({
      where: {
        date: { gte: startDate, lte: now },
        ...barberFilter,
      },
      include: {
        barber: { include: { user: true } },
        services: { include: { service: true } },
      },
    });

    const sales = await prisma.sale.findMany({
      where: { date: { gte: startDate, lte: now } },
      include: {
        products: { include: { product: true } },
      },
    });

    const financialRecords = await prisma.financialRecord.findMany({
      where: {
        date: { gte: startDate, lte: now },
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
  } catch (error) {
    console.error('[GET /dashboard] erro:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório do dashboard.' });
  }
});

export default router;
