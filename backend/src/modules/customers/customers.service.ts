import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CustomerRepository } from './repositories/customer.repository';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerFilterDto } from './dto/customer-filter.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async findAll(filter: CustomerFilterDto) {
    return this.customerRepository.findAll(filter);
  }

  async findOne(id: string) {
    const customer = await this.customerRepository.findById(id);
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }
    return customer;
  }

  async create(createCustomerDto: CreateCustomerDto) {
    const { email, phone, ...data } = createCustomerDto;

    if (email) {
      const existing = await this.customerRepository.findAll({
        search: email,
        page: 1,
        limit: 1,
      });
      if (existing.items.length > 0) {
        throw new ConflictException(
          `Customer with email ${email} already exists`,
        );
      }
    }

    return this.customerRepository.create({
      ...data,
      email,
      phone,
    });
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto) {
    await this.findOne(id);
    return this.customerRepository.update(id, updateCustomerDto);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.customerRepository.delete(id);
  }

  async incrementOrderCount(id: string) {
    return this.customerRepository.incrementOrderCount(id);
  }

  async decrementOrderCount(id: string) {
    return this.customerRepository.decrementOrderCount(id);
  }
}
