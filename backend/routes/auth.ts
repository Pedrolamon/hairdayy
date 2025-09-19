import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from "bcrypt";
import jwt, { Secret, SignOptions } from "jsonwebtoken";
import { Router, Request, Response } from "express";
import { authenticateJWT, AuthRequest } from "../middleware/auth";
import { notifyWelcome } from "../utils/notificationService";


const router = Router();
const prisma = new PrismaClient();

// Função para gerar código de indicação amigável
function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
} 

// Registro
router.post("/register", async (req: Request, res: Response) => {
  const { name, email, password, role, phone, referralCode } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "Nome, email e senha são obrigatórios." });
  }

  try {
    // Verifica se já existe usuário com esse e-mail
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: "E-mail já cadastrado." });
    }

    // Hash da senha
    const hashed = await bcrypt.hash(password, 10);

    // Define papel
    const roleValue = role ? (role.toUpperCase() as UserRole) : UserRole.BARBER;

    // Cria usuário
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: roleValue,
        phone,
        referralCode: generateReferralCode(), // cada user ganha um código único
        ...(roleValue === UserRole.BARBER && {
          barber: { create: {} },
        }),
      },
      include: {
        barber: true,
      },
    });

    // Cria assinatura inicial (R$30,00 por padrão)
    await prisma.subscription.create({
      data: {
        userId: user.id,
        price: 30,
        status: "ACTIVE",
        startDate: new Date(),
      },
    });

    // Se foi passado um código de indicação, cria vínculo
    if (referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode },
      });

      if (referrer) {
        await prisma.referral.create({
          data: {
            referrerId: referrer.id,
            refereeId: user.id,
            active: true,
          },
        });
      }
    }

    // Enviar notificação de boas-vindas
    await notifyWelcome(user.id, user.name);

    return res.status(201).json({
      message: "Usuário registrado com sucesso.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        barber: user.barber,
      },
    });
  } catch (error) {
    console.error("Erro ao registrar usuário:", error);
    return res.status(500).json({
      message: "Ocorreu um erro no servidor. Por favor, tente novamente mais tarde.",
    });
  }
});

// Login
router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "E-mail e senha são obrigatórios." });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ message: "Credenciais inválidas." });
  }
  
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ message: "Credenciais inválidas." });
  }

  const secret: Secret = process.env.JWT_SECRET || "secret";
  const expiresInValue: string = process.env.JWT_EXPIRES_IN || "1d";
  const jwtSignOptions: SignOptions = { expiresIn: expiresInValue as SignOptions['expiresIn']}
  
  const token = jwt.sign({ id: user.id, role: user.role }, secret, jwtSignOptions);
  return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

//rota para buscar suas proprias informações 
router.get("/me", authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId || typeof req.userId !== 'string') {
        return res.status(401).json({ message: "Usuário não autenticado." });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: {
        barber: true,
      },
    });
  
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }
  
    const { password, ...userData } = user;
    return res.json(userData);
  } catch (error) {
    console.error("Error fetching user data:", error);
    return res.status(500).json({ message: "Erro ao buscar os dados do usuário." });
  }
});

//rota para logout
router.post("/logout", authenticateJWT, (req: Request, res: Response) => {
  return res.status(200).json({ message: "Logout bem-sucedido." });
});

router.delete("/delete-account", authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { password } = req.body as { password?: string };

    if (!userId) return res.status(401).json({ message: "Não autorizado." });
    if (!password) return res.status(400).json({ message: "Senha é obrigatória para exclusão." });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: "Usuário não encontrado." });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(403).json({ message: "Senha incorreta." });

   await prisma.$transaction(async (tx) => {
  // 1. Notificações
  await tx.notification.deleteMany({ where: { userId } });

  // 2. AppointmentService (pivot entre appointment e service)
  await tx.appointmentService.deleteMany({
    where: { service: { userId } },
  });

  // 3. Services
  await tx.service.deleteMany({ where: { userId } });

  // 4. SaleProduct (pivot entre sale e product)
  await tx.saleProduct.deleteMany({
    where: { product: { userId } },
  });

  await tx.saleProduct.deleteMany({
    where: { sale: { userId } },
  });

  await tx.product.deleteMany({ where: { userId } });
  await tx.sale.deleteMany({ where: { userId } });
  await tx.financialRecord.deleteMany({ where: { userId } });
  await tx.subscription.deleteMany({ where: { userId } });
  await tx.referral.deleteMany({ where: { referrerId: userId } });
  await tx.referral.deleteMany({ where: { refereeId: userId } });
  await tx.appointment.deleteMany({ where: { clientId: userId } });
  await tx.availabilityBlock.deleteMany({
    where: { barber: { userId } },
  });
  await tx.barber.deleteMany({ where: { userId } });
  await tx.personalInformation.deleteMany({ where: { userId } });
  await tx.user.delete({ where: { id: userId } });
});


    return res.status(200).json({ message: "Conta apagada com sucesso." });
  } catch (err) {
    console.error("Erro ao apagar conta:", err);
    return res.status(500).json({ message: "Erro interno ao apagar conta." });
  }
});


export default router;
