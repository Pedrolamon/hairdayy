import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from "bcrypt";
import jwt, { Secret, SignOptions } from "jsonwebtoken";
import { Router, Request, Response } from "express";
import { authenticateJWT, AuthRequest } from "../middleware/auth";


const router = Router();
const prisma = new PrismaClient(); 

// Registro
router.post("/register", async (req: Request, res: Response) => {
  const { name, email, password, role, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Nome, email e senha são obrigatórios." });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: "E-mail já cadastrado." });
    }

    const hashed = await bcrypt.hash(password, 10);
    
    // Convertemos a string do role para maiúsculas para que corresponda ao enum do Prisma
    const roleValue = role ? (role.toUpperCase() as UserRole) : UserRole.BARBER;

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: roleValue, 
        phone,
        ...(roleValue === UserRole.BARBER && {
          barber: { create: {} }
        })
      },
      include: {
        barber: true, 
      },
    });
    
    return res.status(201).json({ 
      message: "Usuário registrado com sucesso." ,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, barber: user.barber }});
  } catch (error) {
    console.error("Erro ao registrar usuário:", error);
    return res.status(500).json({ message: "Ocorreu um erro no servidor. Por favor, tente novamente mais tarde." });
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

router.post("/logout", authenticateJWT, (req: AuthRequest, res: Response) => {
  return res.status(200).json({ message: "Logout bem-sucedido." });
});
export default router;
