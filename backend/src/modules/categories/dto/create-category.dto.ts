import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { CategoryStatus } from '../entities/category.entity';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(CategoryStatus)
  @IsOptional()
  status?: CategoryStatus;

  @IsNumber()
  @IsOptional()
  productCount?: number;
}
