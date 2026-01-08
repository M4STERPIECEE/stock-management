import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { StockService } from './stock.service';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('stock')
@UseGuards(JwtAuthGuard)
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get('movements')
  findAll(@Query('productId') productId?: string) {
    return this.stockService.findAll(productId);
  }

  @Post('movements')
  create(@Body() createStockMovementDto: CreateStockMovementDto) {
    return this.stockService.createMovement(createStockMovementDto);
  }
}
