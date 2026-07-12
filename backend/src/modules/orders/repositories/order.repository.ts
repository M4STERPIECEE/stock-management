import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order, OrderStatus } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { OrderFilterDto } from '../dto/order-filter.dto';

@Injectable()
export class OrderRepository {
  constructor(
    @InjectRepository(Order)
    private readonly repository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    private dataSource: DataSource,
  ) {}

  getDataSource(): DataSource {
    return this.dataSource;
  }

  getRepository(): Repository<Order> {
    return this.repository;
  }

  getOrderItemRepository(): Repository<OrderItem> {
    return this.orderItemRepository;
  }

  async findAll(
    filter: OrderFilterDto,
  ): Promise<{ items: Order[]; total: number }> {
    const { status, customerId, search, page = 1, limit = 10 } = filter;
    const query = this.repository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product');

    if (status) {
      query.andWhere('order.status = :status', { status });
    }

    if (customerId) {
      query.andWhere('order.customerId = :customerId', { customerId });
    }

    if (search) {
      query.andWhere(
        '(customer.name ILIKE :search OR order.id::text ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    query.skip((page - 1) * limit).take(limit);
    query.orderBy('order.createdAt', 'DESC');

    const [items, total] = await query.getManyAndCount();
    return { items, total };
  }

  async findById(id: string): Promise<Order | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['customer', 'items', 'items.product'],
    });
  }

  async getStatusCounts(): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};
    for (const status of Object.values(OrderStatus)) {
      counts[status] = await this.repository.count({
        where: { status },
      });
    }
    return counts;
  }

  async getTotalRevenue(startDate?: Date, endDate?: Date): Promise<number> {
    const query = this.repository
      .createQueryBuilder('order')
      .select('COALESCE(SUM(order.totalAmount), 0)', 'total')
      .where('order.status != :cancelled', { cancelled: OrderStatus.ANNULEE });

    if (startDate) {
      query.andWhere('order.createdAt >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('order.createdAt <= :endDate', { endDate });
    }

    const result = await query.getRawOne<{ total: string }>();
    return parseFloat(result?.total || '0');
  }

  async getRecentOrders(limit: number = 10): Promise<Order[]> {
    return this.repository.find({
      relations: ['customer', 'items', 'items.product'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async saveOrder(order: Order): Promise<Order> {
    return this.repository.save(order);
  }
}
