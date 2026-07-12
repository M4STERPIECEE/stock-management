import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { StockService } from './stock.service';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { ReverseStockMovementDto } from './dto/reverse-stock-movement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('stock')
@Controller('stock')
@UseGuards(JwtAuthGuard)
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get('movements')
  @ApiOperation({ summary: 'List stock movements' })
  findAll(@Query('productId') productId?: string) {
    return this.stockService.findAll(productId);
  }

  @Post('movements')
  @ApiOperation({ summary: 'Create a stock movement' })
  create(@Body() createStockMovementDto: CreateStockMovementDto) {
    return this.stockService.createMovement(createStockMovementDto);
  }

  @Post('movements/:id/reverse')
  @ApiOperation({
    summary: 'Reverse a stock movement (creates counter-movement)',
  })
  reverse(@Param('id') id: string, @Body() dto: ReverseStockMovementDto) {
    return this.stockService.reverseMovement(id, dto.reason);
  }
}
