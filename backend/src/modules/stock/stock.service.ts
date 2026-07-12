import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  StockMovement,
  StockMovementType,
} from './entities/stock-movement.entity';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { Product } from '../products/entities/product.entity';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(StockMovement)
    private readonly stockMovementRepository: Repository<StockMovement>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private dataSource: DataSource,
  ) {}

  async findAll(productId?: string): Promise<StockMovement[]> {
    const query = this.stockMovementRepository
      .createQueryBuilder('movement')
      .leftJoinAndSelect('movement.product', 'product')
      .orderBy('movement.createdAt', 'DESC');

    if (productId) {
      query.where('movement.productId = :productId', { productId });
    }

    return query.getMany();
  }

  async createMovement(dto: CreateStockMovementDto): Promise<StockMovement> {
    const { productId, type, quantity, reason } = dto;

    const product = await this.productRepository.findOne({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Use transaction to ensure both movement and product update are consistent
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const oldQuantity = product.stockQuantity;
      let newQuantity = oldQuantity;

      if (type === StockMovementType.ENTRY) {
        newQuantity += quantity;
      } else if (type === StockMovementType.EXIT) {
        if (oldQuantity < quantity) {
          throw new BadRequestException('Insufficient stock for this exit');
        }
        newQuantity -= quantity;
      } else if (type === StockMovementType.ADJUSTMENT) {
        newQuantity = quantity;
      }

      product.stockQuantity = newQuantity;
      product.stockStatus = this.calculateStockStatus(
        newQuantity,
        product.minStockThreshold,
      );
      await queryRunner.manager.save(Product, product);

      const movement = this.stockMovementRepository.create({
        productId,
        type,
        quantity:
          type === StockMovementType.ADJUSTMENT
            ? newQuantity - oldQuantity
            : quantity,
        reason,
      });

      const savedMovement = await queryRunner.manager.save(
        StockMovement,
        movement,
      );

      await queryRunner.commitTransaction();
      return savedMovement;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async reverseMovement(
    movementId: string,
    reason?: string,
  ): Promise<StockMovement> {
    const originalMovement = await this.stockMovementRepository.findOne({
      where: { id: movementId },
    });
    if (!originalMovement) {
      throw new NotFoundException(
        `Stock movement with ID ${movementId} not found`,
      );
    }

    // Determine the opposite movement type
    const reverseType =
      originalMovement.type === StockMovementType.ENTRY
        ? StockMovementType.EXIT
        : originalMovement.type === StockMovementType.EXIT
          ? StockMovementType.ENTRY
          : StockMovementType.ADJUSTMENT;

    const reverseReason =
      reason ||
      `Contre-mouvement du ${originalMovement.type} #${movementId.slice(0, 8)}`;

    // Use the same createMovement method to ensure atomicity
    return this.createMovement({
      productId: originalMovement.productId,
      type: reverseType,
      quantity: originalMovement.quantity,
      reason: reverseReason,
    });
  }

  private calculateStockStatus(quantity: number, threshold: number): string {
    if (quantity <= 0) return 'RUPTURE';
    if (quantity <= threshold / 2) return 'CRITIQUE';
    if (quantity <= threshold) return 'FAIBLE';
    return 'EN_STOCK';
  }
}
