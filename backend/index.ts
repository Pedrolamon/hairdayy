import dotenv from "dotenv";
import express, { Application } from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import serviceRoutes from "./routes/service";
import appointmentRoutes from "./routes/appointment";
import barberRoutes from "./routes/barber";
import financialRoutes from "./routes/financial";
import productRoutes from "./routes/product";
import saleRoutes from "./routes/sale";
import notificationRoutes from "./routes/notification";
import dashboardRoutes from "./routes/dashboard";

dotenv.config();

// Inicializa o aplicativo Express
const app: Application = express();
const PORT = process.env.PORT || 4000;

// Middleware para permitir requisições de outras origens (CORS) e processar JSON
app.use(cors());
app.use(express.json());

// Configuração de todas as rotas da sua aplicação
// Cada rota é mapeada para um arquivo de rotas específico
app.use("/api/auth", authRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/barbers", barberRoutes);
app.use("/api/financial", financialRoutes);
app.use("/api/products", productRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Rota de teste
app.get("/", (req, res) => {
  res.send("API Hairday Backend rodando!");
});

// Middleware para tratar rotas não encontradas (erro 404)
app.use((req, res, next) => {
  console.error(`404: Rota não encontrada - ${req.originalUrl}`);
  res.status(404).json({ message: 'Recurso não encontrado.' });
});

// Inicia o servidor na porta definida
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
