import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { StockService } from './stock.service';
import {
  StockMovement,
  StockMovementType,
} from './entities/stock-movement.entity';
import { Product } from '../products/entities/product.entity';
import { BadRequestException } from '@nestjs/common';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';

describe('StockService', () => {
  let service: StockService;

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockDataSource = {
    createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
  };

  const mockStockMovementRepository = {
    createQueryBuilder: jest.fn().mockReturnValue({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    }),
    create: jest.fn(),
  };

  const mockProductRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockService,
        { provide: DataSource, useValue: mockDataSource },
        {
          provide: getRepositoryToken(StockMovement),
          useValue: mockStockMovementRepository,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
      ],
    }).compile();

    service = module.get<StockService>(StockService);
  });

  describe('createMovement', () => {
    it('should throw error for insufficient stock on EXIT', async () => {
      const dto: CreateStockMovementDto = {
        productId: 'prod-uuid',
        type: StockMovementType.EXIT,
        quantity: 100,
        reason: 'Test exit',
      };

      mockProductRepository.findOne.mockResolvedValue({
        id: 'prod-uuid',
        stockQuantity: 10,
        minStockThreshold: 5,
      });

      await expect(service.createMovement(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should successfully create an ENTRY movement', async () => {
      const dto: CreateStockMovementDto = {
        productId: 'prod-uuid',
        type: StockMovementType.ENTRY,
        quantity: 50,
        reason: 'Restock',
      };

      const mockProduct = {
        id: 'prod-uuid',
        stockQuantity: 10,
        minStockThreshold: 5,
        stockStatus: 'FAIBLE',
      };

      mockProductRepository.findOne.mockResolvedValue(mockProduct);
      mockQueryRunner.manager.save.mockResolvedValue({
        ...mockProduct,
        stockQuantity: 60,
      });

      await service.createMovement(dto);

      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });
});
