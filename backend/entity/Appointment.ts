import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, ManyToMany, JoinTable } from "typeorm";
import { User } from "./User";
import { Service } from "./Service";
import { Unit } from './Unit';

export type AppointmentStatus = "scheduled" | "completed" | "cancelled" | "no_show";

@Entity()
export class Appointment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  date!: string;

  @Column()
  startTime!: string;

  @Column()
  endTime!: string;

  @Column()
  status!: AppointmentStatus;

  @Column({ default: false })
  reminderSent!: boolean;

  @Column({ default: 'email' })
  reminderChannel!: string;

  @ManyToOne(() => User)
  user!: User;

  @ManyToOne(() => User, { nullable: true })
  barber!: User;

  @ManyToOne(() => Unit)
  unit!: Unit;

  @ManyToMany(() => Service)
  @JoinTable()
  services!: Service[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 