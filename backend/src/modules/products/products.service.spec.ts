import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { ProductRepository } from './repositories/product.repository';
import { ProductCacheService } from './services/product-cache.service';
import { CategoriesService } from '../categories/categories.service';
import { ConflictException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';

describe('ProductsService', () => {
  let service: ProductsService;

  const mockProductRepository = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByReference: jest.fn(),
    findLastReference: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getStats: jest.fn(),
  };

  const mockCategoriesService = {
    findOne: jest.fn(),
    incrementProductCount: jest.fn(),
    decrementProductCount: jest.fn(),
    findByName: jest.fn(),
    create: jest.fn(),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    clear: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: ProductRepository, useValue: mockProductRepository },
        { provide: CategoriesService, useValue: mockCategoriesService },
        { provide: ProductCacheService, useValue: mockCacheService },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a product successfully', async () => {
      const dto: CreateProductDto = {
        name: 'Test Product',
        categoryId: 'cat-uuid',
        price: 99.99,
        stockQuantity: 50,
      };

      const mockCategory = { id: 'cat-uuid', name: 'Test Category' };
      const mockProduct = { id: 'prod-uuid', ...dto, reference: 'REF-00001' };

      mockCategoriesService.findOne.mockResolvedValue(mockCategory);
      mockProductRepository.findByReference.mockResolvedValue(null);
      mockProductRepository.findLastReference.mockResolvedValue(null);
      mockProductRepository.create.mockResolvedValue(mockProduct);

      const result = await service.create(dto);

      expect(result).toEqual(mockProduct);
      expect(mockCategoriesService.incrementProductCount).toHaveBeenCalledWith(
        'cat-uuid',
      );
      expect(mockCacheService.clear).toHaveBeenCalled();
    });

    it('should throw ConflictException if reference exists', async () => {
      const dto: CreateProductDto = {
        name: 'Test Product',
        categoryId: 'cat-uuid',
        price: 99.99,
        reference: 'REF-00001',
      };

      mockCategoriesService.findOne.mockResolvedValue({
        id: 'cat-uuid',
      });
      mockProductRepository.findByReference.mockResolvedValue({
        id: 'existing',
      });

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });
});
