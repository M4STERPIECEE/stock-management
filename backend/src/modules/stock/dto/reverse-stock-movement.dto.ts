import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReverseStockMovementDto {
  @ApiProperty({
    description: 'Reason for the reversal',
    required: false,
    example: 'Erreur de saisie',
  })
  @IsString()
  @IsOptional()
  reason?: string;
}
