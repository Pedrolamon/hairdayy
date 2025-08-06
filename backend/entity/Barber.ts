import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, OneToOne, JoinColumn, ManyToOne } from "typeorm";
import { Appointment } from "./Appointment";
import { User } from "./User";
import { AvailabilityBlock } from "./AvailabilityBlock";
import { Unit } from './Unit';

@Entity()
export class Barber {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  commission?: number;

  @OneToOne(() => User)
  user!: User;

  @ManyToOne(() => Unit)
  unit!: Unit;

  @OneToMany(() => Appointment, (appointment) => appointment.barber)
  appointments!: Appointment[];

  @OneToMany(() => AvailabilityBlock, (block) => block.barber)
  availabilityBlocks!: AvailabilityBlock[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;
} 