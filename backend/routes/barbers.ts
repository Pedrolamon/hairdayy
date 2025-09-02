import { Router, Response,Request } from "express";
import prisma from "../prisma";

const router = Router()

router.get("/", async (req: Request, res: Response) => {
  try {
    const barbers = await prisma.barber.findMany({
      include: {
        user: true, 
      },
    });

    res.json(barbers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao buscar barbeiros" });
  }
});

export default router