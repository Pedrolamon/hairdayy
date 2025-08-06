import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany } from "typeorm";
import { Appointment } from "./Appointment";

@Entity()
export class Service {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column('int')
  duration!: number; // minutos

  @Column('decimal', { precision: 10, scale: 2 })
  price!: number;

  @ManyToMany(() => Appointment, (appointment) => appointment.services)
  appointments!: Appointment[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 