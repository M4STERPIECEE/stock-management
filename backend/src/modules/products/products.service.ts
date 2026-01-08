import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ProductRepository } from './repositories/product.repository';
import { ProductCacheService } from './services/product-cache.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductFilterDto } from './dto/product-filter.dto';
import { BulkCreateProductDto } from './dto/bulk-create-product.dto';
import { Product } from './entities/product.entity';
import { CategoriesService } from '../categories/categories.service';
import { Category } from '../categories/entities/category.entity';

@Injectable()
export class ProductsService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly cacheService: ProductCacheService,
    private readonly categoriesService: CategoriesService,
  ) {}

  async findAll(filter: ProductFilterDto) {
    const cacheKey = `products_list_${JSON.stringify(filter)}`;
    const cached = this.cacheService.get<{ items: Product[]; total: number }>(
      cacheKey,
    );
    if (cached) return cached;

    const result = await this.productRepository.findAll(filter);
    this.cacheService.set(cacheKey, result, 300);
    return result;
  }

  async getStats() {
    const cacheKey = 'products_global_stats';
    const cached = this.cacheService.get<{
      total: number;
      lowStock: number;
      outOfStock: number;
    }>(cacheKey);
    if (cached) return cached;

    const stats = await this.productRepository.getStats();
    this.cacheService.set(cacheKey, stats, 300);
    return stats;
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const { categoryId, ...productData } = createProductDto;

    if (!productData.reference) {
      productData.reference = await this.generateReference();
    }

    const existing = await this.productRepository.findByReference(
      productData.reference,
    );
    if (existing) {
      throw new ConflictException(
        `Product with reference ${productData.reference} already exists`,
      );
    }

    const category = await this.categoriesService.findOne(categoryId);

    const product = await this.productRepository.create({
      ...productData,
      category,
      stockStatus: this.calculateStockStatus(
        productData.stockQuantity || 0,
        productData.minStockThreshold || 10,
      ),
    });

    await this.categoriesService.incrementProductCount(categoryId);

    this.cacheService.clear();
    return product;
  }

  async bulkCreate(
    products: BulkCreateProductDto[],
  ): Promise<{ created: number; errors: string[] }> {
    const results: { created: number; errors: string[] } = {
      created: 0,
      errors: [],
    };

    for (const data of products) {
      try {
        const category = await this.categoriesService.findByName(
          data.categoryName,
        );
        if (!category) {
          results.errors.push(
            `Produit "${data.name}": Catégorie "${data.categoryName}" inexistante`,
          );
          continue;
        }

        await this.create({
          name: data.name,
          categoryId: category.id,
          price: data.price,
          stockQuantity: data.stockQuantity,
          minStockThreshold: data.minStockThreshold,
          reference: data.reference,
        });
        results.created++;
      } catch (error) {
        results.errors.push(
          `Produit "${data.name}": ${(error as Error).message}`,
        );
      }
    }

    this.cacheService.clear();
    return results;
  }

  private async generateReference(): Promise<string> {
    const lastRef = await this.productRepository.findLastReference();
    if (!lastRef) {
      return 'REF-00001';
    }

    const match = lastRef.match(/REF-(\d+)/);
    if (!match) {
      return 'REF-00001';
    }

    const nextNumber = parseInt(match[1], 10) + 1;
    return `REF-${nextNumber.toString().padStart(5, '0')}`;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.findOne(id);
    const { categoryId, ...productData } = updateProductDto;

    if (productData.reference && productData.reference !== product.reference) {
      const existing = await this.productRepository.findByReference(
        productData.reference,
      );
      if (existing) {
        throw new ConflictException(
          `Product with reference ${productData.reference} already exists`,
        );
      }
    }

    const updateData: Partial<Product> & { category?: Category } = {
      ...productData,
    };
    if (
      categoryId &&
      (!product.category || categoryId !== product.category.id)
    ) {
      if (product.category) {
        await this.categoriesService.decrementProductCount(product.category.id);
      }
      updateData.category = await this.categoriesService.findOne(categoryId);
      await this.categoriesService.incrementProductCount(categoryId);
    }

    if (
      productData.stockQuantity !== undefined ||
      productData.minStockThreshold !== undefined
    ) {
      updateData.stockStatus = this.calculateStockStatus(
        productData.stockQuantity ?? product.stockQuantity,
        productData.minStockThreshold ?? product.minStockThreshold,
      );
    }

    const updated = await this.productRepository.update(id, updateData);
    this.cacheService.clear();
    return updated!;
  }

  private calculateStockStatus(quantity: number, threshold: number): string {
    if (quantity <= 0) return 'RUPTURE';
    if (quantity <= threshold / 2) return 'CRITIQUE';
    if (quantity <= threshold) return 'FAIBLE';
    return 'EN_STOCK';
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.delete(id);
    if (product.category) {
      await this.categoriesService.decrementProductCount(product.category.id);
    }
    this.cacheService.clear();
  }
}
