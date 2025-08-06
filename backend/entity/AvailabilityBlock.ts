import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Barber } from "./Barber";

@Entity()
export class AvailabilityBlock {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  date!: string; // YYYY-MM-DD

  @Column()
  startTime!: string; // HH:mm

  @Column()
  endTime!: string; // HH:mm

  @Column({ nullable: true })
  reason!: string;

  @ManyToOne(() => Barber, (barber) => barber.availabilityBlocks)
  barber!: Barber;
} 