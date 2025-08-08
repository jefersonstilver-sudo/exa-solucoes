/**
 * Cache service para otimizar validações de upload
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class VideoUploadCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly defaultTtl = 5 * 60 * 1000; // 5 minutos

  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTtl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  // Invalidar cache relacionado a um pedido
  invalidateOrder(orderId: string): void {
    const keysToDelete: string[] = [];
    for (const [key] of this.cache) {
      if (key.includes(orderId)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  // Debug: listar entradas do cache
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const uploadCache = new VideoUploadCache();

// Funções helper para chaves padronizadas
export const getCacheKey = {
  security: (orderId: string) => `security:${orderId}`,
  cleanup: (userId: string) => `cleanup:${userId}`,
  conflicts: (orderId: string, rules: string) => `conflicts:${orderId}:${rules}`,
  validation: (fileHash: string) => `validation:${fileHash}`
};