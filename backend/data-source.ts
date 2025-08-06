import "reflect-metadata";
import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
import { AvailabilityBlock } from "./entity/AvailabilityBlock";
import { User } from "./entity/User";
import { Service } from "./entity/Service";
import { Appointment } from "./entity/Appointment";
import { FinancialRecord } from "./entity/FinancialRecord";
import { Barber } from "./entity/Barber";
import { Product } from "./entity/Product";
import { Sale } from "./entity/Sale";
import { Notification } from "./entity/Notification";
import { Unit } from "./entity/Unit";

dotenv.config();

console.log('DATABASE_URL lida:', process.env.DATABASE_URL);

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  synchronize: true, // Em produção, use migrations!
  logging: false,
  entities: [User, Service, Appointment, FinancialRecord, Barber, AvailabilityBlock, Product, Sale, Notification, Unit],
  migrations: [__dirname + "/migration/*.{ts,js}"],
  subscribers: [],
}); 