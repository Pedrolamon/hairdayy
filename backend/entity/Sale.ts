import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from 'typeorm';
import { Product } from './Product';

@Entity()
export class Sale {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  date!: Date;

  @Column('decimal', { precision: 10, scale: 2 })
  total!: number;

  @Column({ nullable: true })
  clientName!: string;

  @ManyToMany(() => Product)
  @JoinTable()
  products!: Product[];

  @Column('jsonb')
  quantities!: { [productId: number]: number };
} 