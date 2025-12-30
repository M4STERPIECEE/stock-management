import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { ProductFilterDto } from '../dto/product-filter.dto';

@Injectable()
export class ProductRepository {
  constructor(
    @InjectRepository(Product)
    private readonly repository: Repository<Product>,
  ) {}

  async findAll(
    filter: ProductFilterDto,
  ): Promise<{ items: Product[]; total: number }> {
    const { search, category, stockStatus, page = 1, limit = 10 } = filter;
    const query = this.repository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category');

    if (search) {
      query.andWhere(
        '(product.name ILIKE :search OR product.reference ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (category) {
      query.andWhere('(category.id = :category OR category.name = :category)', {
        category,
      });
    }

    if (stockStatus) {
      if (stockStatus === 'OUT_OF_STOCK') {
        query.andWhere('product.stockQuantity = 0');
      } else if (stockStatus === 'LOW_STOCK') {
        query.andWhere(
          'product.stockQuantity > 0 AND product.stockQuantity <= product.minStockThreshold',
        );
      } else if (stockStatus === 'IN_STOCK') {
        query.andWhere('product.stockQuantity > product.minStockThreshold');
      }
    }

    query.skip((page - 1) * limit).take(limit);
    query.orderBy('product.createdAt', 'DESC');

    const [items, total] = await query.getManyAndCount();
    return { items, total };
  }

  async findById(id: string): Promise<Product | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['category'],
    });
  }

  async findByReference(reference: string): Promise<Product | null> {
    return this.repository.findOne({ where: { reference } });
  }

  async findLastReference(): Promise<string | null> {
    const lastProduct = await this.repository.findOne({
      where: {},
      order: { reference: 'DESC' },
    });
    return lastProduct ? lastProduct.reference : null;
  }

  async create(product: Partial<Product>): Promise<Product> {
    const newProduct = this.repository.create(product);
    return this.repository.save(newProduct);
  }

  async update(id: string, product: Partial<Product>): Promise<Product | null> {
    await this.repository.update(id, product);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
