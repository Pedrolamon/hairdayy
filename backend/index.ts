import dotenv from "dotenv";
import "reflect-metadata";
import express from "express";
import cors from "cors";
import { AppDataSource } from "./data-source";
import authRoutes from "./routes/auth";
import serviceRoutes from "./routes/service";
import appointmentRoutes from "./routes/appointment";
import barberRoutes from "./routes/barber";
import financialRoutes from "./routes/financial";
import productRoutes from "./routes/product";
import saleRoutes from "./routes/sale";
import notificationRoutes from "./routes/notification";
import unitRoutes from "./routes/unit";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/barbers", barberRoutes);
app.use("/api/financial", financialRoutes);
app.use("/api/products", productRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/units", unitRoutes);

const PORT = process.env.PORT || 4000;

AppDataSource.initialize()
  .then(() => {
    console.log("Data Source has been initialized!");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error during Data Source initialization", err);
  });

// Rotas de teste
app.get("/", (req, res) => {
  res.send("API Hairday Backend rodando!");
}); 