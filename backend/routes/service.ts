import { Router } from "express";
import { AppDataSource } from "../data-source";
import { Service } from "../entity/Service";
import { authenticateJWT, AuthRequest } from "../middleware/auth";

const router = Router();
const repo = () => AppDataSource.getRepository(Service);

// Listar todos os serviços
router.get("/", authenticateJWT, async (req, res) => {
  const services = await repo().find();
  res.json(services);
});

// Obter serviço por ID
router.get("/:id", authenticateJWT, async (req, res) => {
  const service = await repo().findOneBy({ id: Number(req.params.id) });
  if (!service) return res.status(404).json({ message: "Serviço não encontrado." });
  res.json(service);
});

// Criar serviço
router.post("/", authenticateJWT, async (req: AuthRequest, res) => {
  const { name, duration, price } = req.body;
  if (!name || !duration || !price) {
    return res.status(400).json({ message: "Nome, duração e preço são obrigatórios." });
  }
  const service = repo().create({ name, duration, price });
  await repo().save(service);
  res.status(201).json(service);
});

// Atualizar serviço
router.put("/:id", authenticateJWT, async (req, res) => {
  const { name, duration, price } = req.body;
  const service = await repo().findOneBy({ id: Number(req.params.id) });
  if (!service) return res.status(404).json({ message: "Serviço não encontrado." });
  service.name = name ?? service.name;
  service.duration = duration ?? service.duration;
  service.price = price ?? service.price;
  await repo().save(service);
  res.json(service);
});

// Deletar serviço
router.delete("/:id", authenticateJWT, async (req, res) => {
  const service = await repo().findOneBy({ id: Number(req.params.id) });
  if (!service) return res.status(404).json({ message: "Serviço não encontrado." });
  await repo().remove(service);
  res.json({ message: "Serviço removido." });
});

export default router; 