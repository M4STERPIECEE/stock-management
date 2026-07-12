import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../entities/customer.entity';
import { CustomerFilterDto } from '../dto/customer-filter.dto';

@Injectable()
export class CustomerRepository {
  constructor(
    @InjectRepository(Customer)
    private readonly repository: Repository<Customer>,
  ) {}

  async findAll(
    filter: CustomerFilterDto,
  ): Promise<{ items: Customer[]; total: number }> {
    const { search, status, page = 1, limit = 10 } = filter;
    const query = this.repository.createQueryBuilder('customer');

    if (search) {
      query.andWhere(
        '(customer.name ILIKE :search OR customer.email ILIKE :search OR customer.phone ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (status) {
      query.andWhere('customer.status = :status', { status });
    }

    query.skip((page - 1) * limit).take(limit);
    query.orderBy('customer.createdAt', 'DESC');

    const [items, total] = await query.getManyAndCount();
    return { items, total };
  }

  async findById(id: string): Promise<Customer | null> {
    return this.repository.findOne({ where: { id } });
  }

  async create(customer: Partial<Customer>): Promise<Customer> {
    const newCustomer = this.repository.create(customer);
    return this.repository.save(newCustomer);
  }

  async update(
    id: string,
    customer: Partial<Customer>,
  ): Promise<Customer | null> {
    await this.repository.update(id, customer);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async incrementOrderCount(id: string): Promise<void> {
    await this.repository.increment({ id }, 'orderCount', 1);
  }

  async decrementOrderCount(id: string): Promise<void> {
    await this.repository.decrement({ id }, 'orderCount', 1);
  }
}
