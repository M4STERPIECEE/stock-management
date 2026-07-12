import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { OrderRepository } from './repositories/order.repository';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderFilterDto } from './dto/order-filter.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { StockService } from '../stock/stock.service';
import { CustomersService } from '../customers/customers.service';
import { ProductsService } from '../products/products.service';
import { Product } from '../products/entities/product.entity';
import { StockMovement, StockMovementType } from '../stock/entities/stock-movement.entity';

@Injectable()
export class OrdersService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly stockService: StockService,
    private readonly customersService: CustomersService,
    private readonly productsService: ProductsService,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(StockMovement)
    private readonly stockMovementRepository: Repository<StockMovement>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    private dataSource: DataSource,
  ) {}

  async findAll(filter: OrderFilterDto) {
    return this.orderRepository.findAll(filter);
  }

  async findOne(id: string) {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order;
  }

  async create(createOrderDto: CreateOrderDto) {
    const { customerId, items } = createOrderDto;

    // Verify customer exists
    const customer = await this.customersService.findOne(customerId);

    // Use transaction for atomicity
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Calculate total and verify stock for each product
      let totalAmount = 0;
      const orderItemsData: Array<{
        productId: string;
        quantity: number;
        unitPrice: number;
      }> = [];

      for (const line of items) {
        const product = await this.productRepository.findOne({
          where: { id: line.productId },
        });
        if (!product) {
          throw new NotFoundException(
            `Product with ID ${line.productId} not found`,
          );
        }

        if (product.stockQuantity < line.quantity) {
          throw new BadRequestException(
            `Insufficient stock for product "${product.name}". Available: ${product.stockQuantity}, requested: ${line.quantity}`,
          );
        }

        const lineTotal = Number(product.price) * line.quantity;
        totalAmount += lineTotal;

        orderItemsData.push({
          productId: line.productId,
          quantity: line.quantity,
          unitPrice: Number(product.price),
        });

        // Decrement stock directly using queryRunner
        product.stockQuantity -= line.quantity;
        product.stockStatus = this.calculateStockStatus(
          product.stockQuantity,
          product.minStockThreshold,
        );
        await queryRunner.manager.save(Product, product);

        // Record stock movement entity
        const movement = this.stockMovementRepository.create({
          productId: line.productId,
          type: StockMovementType.EXIT,
          quantity: line.quantity,
          reason: `Sortie pour commande (en cours de création)`,
        });
        await queryRunner.manager.save(StockMovement, movement);
      }

      // Create order
      const order = this.orderRepository.getRepository().create({
        customerId,
        totalAmount,
        status: OrderStatus.EN_ATTENTE,
      });
      const savedOrder = await queryRunner.manager.save(Order, order);

      // Update the stock movements with the order reference
      // (Note: createMovement from StockService uses its own queryRunner,
      // so we use direct entity saves within our transaction)

      // Create order items
      for (const itemData of orderItemsData) {
        const orderItem = this.orderItemRepository.create({
          orderId: savedOrder.id,
          productId: itemData.productId,
          quantity: itemData.quantity,
          unitPrice: itemData.unitPrice,
        });
        await queryRunner.manager.save(OrderItem, orderItem);
      }

      // Update customer order count
      await queryRunner.manager.increment(
        'customers',
        { id: customerId },
        'order_count',
        1,
      );

      await queryRunner.commitTransaction();

      return this.orderRepository.findById(savedOrder.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async updateStatus(id: string, updateStatusDto: UpdateOrderStatusDto) {
    const order = await this.findOne(id);
    const newStatus = updateStatusDto.status;
    const oldStatus = order.status;

    // Validate transitions
    this.validateStatusTransition(oldStatus, newStatus);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // If cancelling, reinject stock
      if (
        newStatus === OrderStatus.ANNULEE &&
        oldStatus !== OrderStatus.ANNULEE
      ) {
        const fullOrder = await this.orderRepository.findById(id);
        if (fullOrder && fullOrder.items) {
          for (const item of fullOrder.items) {
            const product = await this.productRepository.findOne({
              where: { id: item.productId },
            });
            if (product) {
              product.stockQuantity += item.quantity;
              product.stockStatus = this.calculateStockStatus(
                product.stockQuantity,
                product.minStockThreshold,
              );
              await queryRunner.manager.save(Product, product);

              const movement = this.stockMovementRepository.create({
                productId: item.productId,
                type: StockMovementType.ENTRY,
                quantity: item.quantity,
                reason: `Annulation commande #${id}`,
              });
              await queryRunner.manager.save(StockMovement, movement);
            }
          }
        }
      }

      order.status = newStatus;
      await queryRunner.manager.save(Order, order);
      await queryRunner.commitTransaction();

      return this.orderRepository.findById(id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  private validateStatusTransition(
    current: OrderStatus,
    next: OrderStatus,
  ): void {
    if (current === OrderStatus.LIVREE || current === OrderStatus.ANNULEE) {
      throw new BadRequestException(
        `Cannot change status from ${current}`,
      );
    }
    // All other transitions are allowed
  }

  private calculateStockStatus(quantity: number, threshold: number): string {
    if (quantity <= 0) return 'RUPTURE';
    if (quantity <= threshold / 2) return 'CRITIQUE';
    if (quantity <= threshold) return 'FAIBLE';
    return 'EN_STOCK';
  }
}
