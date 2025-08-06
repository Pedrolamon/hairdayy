// Substitua o código de importação do TypeORM
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt, { Secret, SignOptions } from "jsonwebtoken";
import { Router, Request, Response } from "express";
import { authenticateJWT } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient(); // Instancie o cliente Prisma

// Registro
router.post("/register", async (req: Request, res: Response) => {
  const { name, email, password, role, phone } = req.body;
  console.log("POST /register - Dados recebidos:", req.body);

  if (!name || !email || !password) {
    console.log("POST /register - Erro: Nome, email e senha são obrigatórios.");
    return res.status(400).json({ message: "Nome, email e senha são obrigatórios." });
  }

  try {
    // Substitui userRepo.findOneBy
    console.log("POST /register - Tentando encontrar usuário existente com e-mail:", email);
    const existing = await prisma.user.findUnique({ where: { email } });
    console.log("POST /register - Resultado de findUnique:", existing);
    if (existing) {
      console.log("POST /register - Erro: E-mail já cadastrado:", email);
      return res.status(409).json({ message: "E-mail já cadastrado." });
    }

    const hashed = await bcrypt.hash(password, 10);
    
    // Substitui userRepo.create e userRepo.save
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: role || "barber",
        phone,
      },
    });

    console.log("POST /register - Usuário salvo com sucesso! ID:",user, user.id);
    return res.status(201).json({ message: "Usuário registrado com sucesso." });
  } catch (error) {
    console.error("Erro ao registrar usuário:", error);
    // Erros de violação de chave única no Prisma também retornam um erro de violação de banco de dados
    return res.status(500).json({ message: "Ocorreu um erro no servidor. Por favor, tente novamente mais tarde." });
  }
});

// Login
router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "E-mail e senha são obrigatórios." });
  }

  // Substitui userRepo.findOneBy
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

// Dados do usuário autenticado
router.get("/me", authenticateJWT, async (req: Request & { userId?: number }, res: Response) => {
  // Substitui userRepo.findOneBy
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) return res.status(404).json({ message: "Usuário não encontrado." });
  return res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

export default router;