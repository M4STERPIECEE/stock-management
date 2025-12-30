import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CategoryRepository } from './repositories/category.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryFilterDto } from './dto/category-filter.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async findAll(filter: CategoryFilterDto) {
    return this.categoryRepository.findAll(filter);
  }

  async findOne(id: string) {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async create(createCategoryDto: CreateCategoryDto) {
    const existing = await this.categoryRepository.findByName(
      createCategoryDto.name,
    );
    if (existing) {
      throw new ConflictException(
        `Category with name ${createCategoryDto.name} already exists`,
      );
    }
    return this.categoryRepository.create(createCategoryDto);
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.findOne(id);

    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existing = await this.categoryRepository.findByName(
        updateCategoryDto.name,
      );
      if (existing) {
        throw new ConflictException(
          `Category with name ${updateCategoryDto.name} already exists`,
        );
      }
    }

    return this.categoryRepository.update(id, updateCategoryDto);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.categoryRepository.delete(id);
  }
}
