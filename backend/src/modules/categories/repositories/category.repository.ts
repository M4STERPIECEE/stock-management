import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { CategoryFilterDto } from '../dto/category-filter.dto';

@Injectable()
export class CategoryRepository {
  constructor(
    @InjectRepository(Category)
    private readonly repository: Repository<Category>,
  ) { }

  async findAll(
    filter: CategoryFilterDto,
  ): Promise<{ items: any[]; total: number }> {
    const { search, status, page = 1, limit = 10 } = filter;
    const query = this.repository
      .createQueryBuilder('category')
      .select([
        'category.id',
        'category.name',
        'category.description',
        'category.status',
        'category.productCount',
        'category.createdAt',
      ]);

    if (search) {
      query.andWhere(
        '(category.name ILIKE :search OR category.description ILIKE :search)',
        {
          search: `%${search}%`,
        },
      );
    }

    if (status) {
      query.andWhere('category.status = :status', { status });
    }

    query.offset((page - 1) * limit).limit(limit);
    query.orderBy('category.name', 'ASC');

    const [items, total] = await query.getManyAndCount();

    return { items, total };
  }

  async findById(id: string): Promise<Category | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByName(name: string): Promise<Category | null> {
    return this.repository.findOne({ where: { name } });
  }

  async create(category: Partial<Category>): Promise<Category> {
    const newCategory = this.repository.create(category);
    return this.repository.save(newCategory);
  }

  async update(
    id: string,
    category: Partial<Category>,
  ): Promise<Category | null> {
    await this.repository.update(id, category);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async incrementProductCount(id: string): Promise<void> {
    await this.repository.increment({ id }, 'productCount', 1);
  }

  async decrementProductCount(id: string): Promise<void> {
    await this.repository.decrement({ id }, 'productCount', 1);
  }
}
