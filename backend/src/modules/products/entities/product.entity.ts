import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  reference: string;

  @Column()
  name: string;

  @ManyToOne(() => Category, (category) => category.products)
  category: Category;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ name: 'stock_quantity', default: 0 })
  stockQuantity: number;

  @Column({
    name: 'stock_status',
    type: 'enum',
    enum: ['CRITIQUE', 'EN_STOCK', 'RUPTURE', 'FAIBLE'],
    default: 'EN_STOCK',
  })
  stockStatus: string;

  @Column({ name: 'min_stock_threshold', default: 10 })
  minStockThreshold: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
