import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { Product } from '../products/entities/product.entity';
import { StockMovement } from '../stock/entities/stock-movement.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(StockMovement)
    private readonly stockMovementRepository: Repository<StockMovement>,
  ) {}

  async getSummary() {
    const now = new Date();
    const currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousPeriodStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1,
    );

    // Current period revenue
    const currentRevenue = await this.getRevenue(
      currentPeriodStart,
      now,
    );
    // Previous period revenue
    const previousRevenue = await this.getRevenue(
      previousPeriodStart,
      currentPeriodStart,
    );

    // Orders by status
    const ordersByStatus = await this.getOrdersByStatus();

    // Total stock value
    const stockValue = await this.getStockValue();

    // Low stock / out of stock
    const lowStock = await this.productRepository.count({
      where: [
        { stockStatus: 'FAIBLE' },
        { stockStatus: 'CRITIQUE' },
        { stockStatus: 'RUPTURE' },
      ],
    });

    const outOfStock = await this.productRepository.count({
      where: { stockStatus: 'RUPTURE' },
    });

    // Recent orders (last 10)
    const recentOrders = await this.orderRepository.find({
      relations: ['customer'],
      order: { createdAt: 'DESC' },
      take: 10,
    });

    const revenueChange =
      previousRevenue > 0
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
        : currentRevenue > 0
          ? 100
          : 0;

    return {
      revenue: {
        current: currentRevenue,
        previous: previousRevenue,
        change: Math.round(revenueChange * 10) / 10,
      },
      ordersByStatus,
      stockValue,
      alerts: {
        lowStock,
        outOfStock,
      },
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        customer: order.customer?.name || 'N/A',
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
      })),
    };
  }

  private async getRevenue(startDate: Date, endDate: Date): Promise<number> {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select('COALESCE(SUM(order.totalAmount), 0)', 'total')
      .where('order.status != :cancelled', {
        cancelled: OrderStatus.ANNULEE,
      })
      .andWhere('order.createdAt >= :startDate', { startDate })
      .andWhere('order.createdAt < :endDate', { endDate })
      .getRawOne();

    return parseFloat(result?.total || '0');
  }

  private async getOrdersByStatus(): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};
    for (const status of Object.values(OrderStatus)) {
      counts[status] = await this.orderRepository.count({
        where: { status },
      });
    }
    return counts;
  }

  private async getStockValue(): Promise<number> {
    const result = await this.productRepository
      .createQueryBuilder('product')
      .select(
        'COALESCE(SUM(product.price * product.stockQuantity), 0)',
        'totalValue',
      )
      .getRawOne();

    return parseFloat(result?.totalValue || '0');
  }
}
