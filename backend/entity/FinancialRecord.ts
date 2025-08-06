import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from "typeorm";
import { Appointment } from "./Appointment";

export type FinancialType = "income" | "expense";

@Entity()
export class FinancialRecord {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  type!: FinancialType;

  @Column('decimal', { precision: 10, scale: 2 })
  amount!: number;

  @Column()
  description!: string;

  @Column()
  date!: string;

  @Column()
  category!: string;

  @ManyToOne(() => Appointment, { nullable: true })
  appointment!: Appointment | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 