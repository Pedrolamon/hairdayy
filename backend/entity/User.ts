import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne } from "typeorm";
import { Appointment } from "./Appointment";
import { Unit } from './Unit';

export type UserRole = "admin" | "barber";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column({ type: "enum", enum: ["admin", "barber"], default: "barber" })
  role!: UserRole;

  @Column({ nullable: true })
  phone!: string;

  @ManyToOne(() => Unit)
  unit!: Unit;

  @OneToMany(() => Appointment, (appointment) => appointment.user)
  appointments!: Appointment[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 