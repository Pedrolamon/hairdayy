import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Unit } from './Unit';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price!: number;

  @Column('int')
  stock!: number;

  @Column({ nullable: true })
  category!: string;

  @Column({ default: true })
  active!: boolean;

  @ManyToOne(() => Unit)
  unit!: Unit;
} 