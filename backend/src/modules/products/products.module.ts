import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from './entities/product.entity';
import { ProductRepository } from './repositories/product.repository';
import { ProductCacheService } from './services/product-cache.service';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product]),
    CategoriesModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService, ProductRepository, ProductCacheService],
  exports: [ProductsService],
})
export class ProductsModule {}
