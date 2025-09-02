// src/routes/admin.ts
import { Router, Request, Response } from "express";
import prisma from "../prisma";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const router = Router();

// Utilitário para agrupar dados por dia
function groupByDay(records: any[], field: string, dateField = "createdAt") {
  const result: Record<string, number> = {};
  for (const r of records) {
    const rawDate = r[dateField];
    if (!rawDate) continue; // 🔥 garante que não quebra
    const date = new Date(rawDate).toISOString().split("T")[0];
    result[date] = (result[date] || 0) + (field ? (r[field] ? 1 : 0) : 1);
  }
  return result;
}



// 📌 Dashboard principal
router.get("/dashboard", async (req: Request, res: Response) => {
  try {
    const appointments = await prisma.appointment.findMany({
      include: { 
       services: { include: { service: true } },
      barber: { include: { user: true } },
      }
    });

    const sales = await prisma.sale.findMany({
      include: { 
        products: { include: { product: true } },
      }
    });

    const totalAppointments = appointments.length;
    const totalSales = sales.length;
    const totalProductsSold = sales.reduce((acc, s) =>{
      return acc + s.products.reduce((pAcc, sp) => pAcc + (sp.quantity ? parseFloat(sp.quantity.toString()) : 0), 0);
    }, 0);
 
    const totalRevenue = sales.reduce((acc, s) => acc + (s.total ? parseFloat(s.total.toString()) : 0), 0);

    // Estatísticas
    const appointmentsByDay = groupByDay(appointments, "id");
    const salesByDay = groupByDay(sales, "id");

    // Serviços mais vendidos
    const topServicesMap: Record<string, number> = {};
    for (const a of appointments) {
      for (const as of a.services) {
        const serviceName = as.service.name;
        topServicesMap[serviceName] = (topServicesMap[serviceName] || 0) + 1;
      }
    }
    const topServices = Object.entries(topServicesMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Barbeiros com mais atendimentos
    const topBarbersMap: Record<string, number> = {};
    for (const a of appointments) {
      if (a.barber?.user) {
        const barberName = a.barber.user.name;
        topBarbersMap[barberName] = (topBarbersMap[barberName] || 0) + 1;
      }
    }
    const topBarbers = Object.entries(topBarbersMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Lista de barbeiros
    const barbers = (await prisma.barber.findMany({
  include: {
    user: {
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      }
    }
  }
})).map(b => ({
  id: b.id,
  name: b.user.name,
  email: b.user.email,
  phone: b.user.phone
}));

    res.json({
      totalAppointments,
      totalSales,
      totalProductsSold,
      totalRevenue,
      appointmentsByDay,
      salesByDay,
      topServices,
      topBarbers,
      barbers,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao carregar dashboard" });
  }
});

// 📌 Criar barbeiro
router.post("/barbers", async (req: Request, res: Response) => {
  try {
    const { name, email } = req.body;
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "BARBER",
        barber: { create: {} },
      },
      include: { barber: true },
    });

    res.json({
      barber: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        barberId: user.barber?.id,
      },
      tempPassword 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao criar barbeiro" });
  }
});

// 📌 Editar barbeiro
router.put("/barbers/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: { name, email },
    });

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao editar barbeiro" });
  }
});

// 📌 Excluir barbeiro
router.delete("/barbers/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const barber = await prisma.barber.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!barber) {
      return res.status(404).json({ message: "Barbeiro não encontrado" });
    }
    await prisma.appointment.deleteMany({
    where: { barberId: barber.id }
    });
    await prisma.barber.delete({ where: { id: barber.id } });

    await prisma.user.delete({ where: { id: barber.userId } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao excluir barbeiro" });
  }
});

export default router;
