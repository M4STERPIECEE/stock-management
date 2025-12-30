import { Injectable } from '@nestjs/common';

interface CacheEntry<T> {
  value: T;
  expiry: number;
}

@Injectable()
export class ProductCacheService {
  private cache = new Map<string, CacheEntry<unknown>>();

  set<T>(key: string, value: T, ttl: number = 3600): void {
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl * 1000,
    });
  }

  get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }
    return cached.value as T;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }
}
