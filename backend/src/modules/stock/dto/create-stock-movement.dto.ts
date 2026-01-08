import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { StockMovementType } from '../entities/stock-movement.entity';

export class CreateStockMovementDto {
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @IsEnum(StockMovementType)
  @IsNotEmpty()
  type: StockMovementType;

  @IsInt()
  @Min(1)
  @IsNotEmpty()
  quantity: number;

  @IsString()
  @IsOptional()
  reason?: string;
}
