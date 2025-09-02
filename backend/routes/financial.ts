import { Router, Request, Response } from "express";
import prisma from "../prisma";
import { authenticateJWT, AuthRequest } from "../middleware/auth";
import { Prisma } from '@prisma/client';

const router = Router();

async function getFinancialReportData(query: Request['query']) {
  const { startDate, endDate, type, category, barberId } = query;
  const where: Prisma.FinancialRecordWhereInput = {};

  if (startDate) {
    where.date = { gte: new Date(startDate as string) };
  }
  if (endDate) {
    where.date = { ...(where.date as object), lte: new Date(endDate as string) };
  }
  if (type) where.type = type as string;
  if (category) where.category = category as string;
  if (barberId) where.appointment = { barberId: barberId as string };

  const records = await prisma.financialRecord.findMany({
    where,
    include: {
      appointment: {
        include: { barber: true },
      },
    },
  });

  const formattedRecords = records.map(record => ({
    ...record,
    amount: record.amount.toNumber(),
  }));

  const receitas = formattedRecords
    .filter(r => r.type === "income")
    .reduce((acc, r) => acc + r.amount, 0);
  
  const despesas = formattedRecords
    .filter(r => r.type === "expense")
    .reduce((acc, r) => acc + r.amount, 0);
  
  const balanco = receitas - despesas;
  
  const porCategoria = formattedRecords.reduce(
    (acc: Record<string, { income: number; expense: number }>, r) => {
      if (!r.category) return acc;
      acc[r.category] = acc[r.category] || { income: 0, expense: 0 };
      acc[r.category][r.type as 'income' | 'expense'] += r.amount;
      return acc;
    },
    {} as Record<string, { income: number; expense: number }>
  );

  return {
    totalReceitas: receitas,
    totalDespesas: despesas,
    balanco,
    porCategoria,
    registros: formattedRecords,
  };
}

// Rota para o relatório financeiro
router.get("/report", authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const reportData = await getFinancialReportData(req.query);
    console.log('--- Back-end: Relatório gerado com sucesso.');
    res.json(reportData);
  } catch (error) {
    console.error('--- Back-end: ERRO CRÍTICO NA ROTA /report ---', error);
    res.status(500).json({ error: "Erro ao gerar relatório financeiro." });
  }
});



router.get("/", authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const records = await prisma.financialRecord.findMany({
      include: { appointment: true },
    });
    res.json(records);
  } catch (error) {
    console.error('Erro ao listar registros financeiros:', error);
    res.status(500).json({ error: "Erro ao listar registros financeiros." });
  }
});

router.get("/:id", authenticateJWT, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const record = await prisma.financialRecord.findUnique({
      where: { id },
      include: { appointment: true },
    });
    if (!record) {
      return res.status(404).json({ message: "Registro não encontrado." });
    }
    res.json(record);
  } catch (error) {
    console.error('Erro ao obter registro financeiro por ID:', error);
    res.status(500).json({ error: "Erro ao obter registro financeiro." });
  }
});

router.post("/", authenticateJWT, async (req: AuthRequest, res: Response) => {
  const { type, amount, description, date, category, appointmentId } = req.body;
  if (!type || !amount || !date) {
    return res.status(400).json({ message: "Tipo, valor e data são obrigatórios." });
  }
  try {
    const data: Prisma.FinancialRecordCreateInput = {
      type,
      amount: new Prisma.Decimal(amount),
      description,
      date: new Date(date),
      category,
      appointment: appointmentId ? { connect: { id: appointmentId } } : undefined,
    };
    const record = await prisma.financialRecord.create({ data });
    res.status(201).json(record);
  } catch (error) {
    console.error('Erro ao criar registro financeiro:', error);
    res.status(500).json({ error: "Erro ao criar registro financeiro." });
  }
});

router.put("/:id", authenticateJWT, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { type, amount, description, date, category, appointmentId } = req.body;
  const updateData: Prisma.FinancialRecordUpdateInput = {};
  if (type) updateData.type = type;
  if (amount) updateData.amount = new Prisma.Decimal(amount);
  if (description) updateData.description = description;
  if (date) updateData.date = new Date(date);
  if (category) updateData.category = category;
  if (appointmentId) {
    updateData.appointment = { connect: { id: appointmentId } };
  } else if (appointmentId === null) {
    updateData.appointment = { disconnect: true };
  }
  try {
    const record = await prisma.financialRecord.update({
      where: { id },
      data: updateData,
    });
    res.json(record);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return res.status(404).json({ message: "Registro não encontrado." });
    }
    console.error('Erro ao atualizar registro financeiro:', error);
    res.status(500).json({ error: "Erro ao atualizar registro financeiro." });
  }
});

router.delete("/:id", authenticateJWT, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.financialRecord.delete({ where: { id } });
    res.json({ message: "Registro removido." });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return res.status(404).json({ message: "Registro não encontrado." });
    }
    console.error('Erro ao deletar registro financeiro:', error);
    res.status(500).json({ error: "Erro ao deletar registro financeiro." });
  }
});

export default router;