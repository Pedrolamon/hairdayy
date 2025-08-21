import dotenv from "dotenv";
import express, { Application } from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import serviceRoutes from "./routes/service";
import appointmentRoutes from "./routes/appointment";
import clientsRoutes from "./routes/clientsRoutes";
import financialRoutes from "./routes/financial";
import productRoutes from "./routes/product";
import saleRoutes from "./routes/sale";
import notificationRoutes from "./routes/notification";
import dashboardRoutes from "./routes/dashboard";
import availabilityRouter from "./routes/Availability";

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 4000;


app.use(cors());
app.use(express.json());


app.use("/api/auth", authRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/clients", clientsRoutes);
app.use("/api/financial", financialRoutes);
app.use("/api/products", productRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/availability", availabilityRouter)

// Rota de teste
app.get("/", (req, res) => {
  res.send("API Hairday Backend rodando!");
});


app.use((req, res, next) => {
  console.error(`404: Rota não encontrada - ${req.originalUrl}`);
  res.status(404).json({ message: 'Recurso não encontrado.' });
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
