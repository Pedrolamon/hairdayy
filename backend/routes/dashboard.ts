import { Router, Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Appointment } from '../entity/Appointment';
import { Service } from '../entity/Service';
import { Barber } from '../entity/Barber';
import { FinancialRecord } from '../entity/FinancialRecord';
import { Sale } from '../entity/Sale';
import { Product } from '../entity/Product';
import { authenticateJWT } from '../middleware/auth';
import { Between } from 'typeorm';

const router = Router();

router.get('/', authenticateJWT, async (req: Request, res: Response) => {
  // Filtros
  const { start, end, barberId } = req.query;
  const now = end ? new Date(String(end)) : new Date();
  const startDate = start ? new Date(String(start)) : new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);

  // Agendamentos
  const appointmentRepo = AppDataSource.getRepository(Appointment);
  const where: any = { date: Between(startDate.toISOString().slice(0, 10), now.toISOString().slice(0, 10)) };
  if (barberId) where.barber = { id: Number(barberId) };
  const appointments = await appointmentRepo.find({ where, relations: ['services', 'barber'] });
  const totalAppointments = appointments.length;

  // Vendas
  const sales = await AppDataSource.getRepository(Sale).find({ relations: ['products'] });
  const totalSales = sales.length;
  const totalProductsSold = sales.reduce((sum, s) => sum + Object.values(s.quantities || {}).reduce((a, b) => a + b, 0), 0);

  // Faturamento (somar FinancialRecord e vendas)
  const financials = await AppDataSource.getRepository(FinancialRecord).find();
  const totalFinancial = financials.reduce((sum, f) => sum + Number(f.amount), 0);
  const totalSalesValue = sales.reduce((sum, s) => sum + Number(s.total), 0);
  const totalRevenue = totalFinancial + totalSalesValue;

  // Top serviços
  const serviceCount: { [name: string]: number } = {};
  appointments.forEach(a => a.services.forEach(s => { serviceCount[s.name] = (serviceCount[s.name] || 0) + 1; }));
  const topServices = Object.entries(serviceCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Top barbeiros
  const barberCount: { [name: string]: number } = {};
  appointments.forEach(a => { if (a.barber) barberCount[a.barber.name] = (barberCount[a.barber.name] || 0) + 1; });
  const topBarbers = Object.entries(barberCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Gráfico: agendamentos por dia
  const appointmentsByDay: { [date: string]: number } = {};
  appointments.forEach(a => { appointmentsByDay[a.date] = (appointmentsByDay[a.date] || 0) + 1; });

  // Gráfico: vendas por dia
  const salesByDay: { [date: string]: number } = {};
  sales.forEach(s => {
    const d = s.date.toISOString().slice(0, 10);
    salesByDay[d] = (salesByDay[d] || 0) + 1;
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
});

export default router; 