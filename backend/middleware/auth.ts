import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  userId?: string;
  role?: string;
}

export function authenticateJWT(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log('--- Auth Middleware: Token ausente ou formato inválido');
    return res.status(401).json({ message: "Token não fornecido." });
  }
  const token = authHeader.split(" ")[1];
  try {
    console.log('--- Auth Middleware: Tentando verificar o token');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret") as any;
    console.log('--- Auth Middleware: Token verificado com sucesso');
    req.userId = decoded.id;
    req.role = decoded.role;
    next();
  } catch (err) {
     console.log('--- Auth Middleware: Erro ao verificar token:', err);
    return res.status(401).json({ message: "Token inválido." });
  }
} 