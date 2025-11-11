/**
 * Sistema de Cache de Vídeos usando IndexedDB
 * Armazena vídeos localmente para reprodução offline
 * Limite: 100MB ou 10 vídeos (LRU - Least Recently Used)
 */

interface CachedVideo {
  videoId: string;
  videoUrl: string;
  blob: Blob;
  cachedAt: number;
  lastAccessedAt: number;
  size: number;
}

interface CacheStats {
  totalSize: number;
  videoCount: number;
  videos: Array<{
    videoId: string;
    size: number;
    cachedAt: Date;
    lastAccessedAt: Date;
  }>;
}

const DB_NAME = 'exa_video_cache';
const STORE_NAME = 'videos';
const DB_VERSION = 1;
const MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_VIDEO_COUNT = 10;

export class VideoCache {
  private db: IDBDatabase | null = null;

  /**
   * Inicializa o IndexedDB
   */
  async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'videoId' });
          store.createIndex('lastAccessedAt', 'lastAccessedAt', { unique: false });
          store.createIndex('cachedAt', 'cachedAt', { unique: false });
        }
      };
    });
  }

  /**
   * Cachear um vídeo
   */
  async cacheVideo(videoId: string, videoUrl: string): Promise<boolean> {
    try {
      await this.init();

      // Verificar se já está em cache
      if (await this.hasCachedVideo(videoId)) {
        return true;
      }
      
      // Baixar o vídeo
      const response = await fetch(videoUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const size = blob.size;

      // Verificar espaço disponível e limpar se necessário
      await this.ensureSpaceAvailable(size);

      // Salvar no IndexedDB
      const cachedVideo: CachedVideo = {
        videoId,
        videoUrl,
        blob,
        cachedAt: Date.now(),
        lastAccessedAt: Date.now(),
        size
      };

      await this.saveToStore(cachedVideo);
      return true;

    } catch (error) {
      return false;
    }
  }

  /**
   * Recuperar vídeo do cache
   */
  async getCachedVideo(videoId: string): Promise<string | null> {
    try {
      await this.init();
      const cachedVideo = await this.getFromStore(videoId);
      if (!cachedVideo) return null;

      // Atualizar lastAccessedAt
      cachedVideo.lastAccessedAt = Date.now();
      await this.saveToStore(cachedVideo);

      // Criar URL do blob
      return URL.createObjectURL(cachedVideo.blob);

    } catch (error) {
      return null;
    }
  }

  /**
   * Verificar se vídeo está em cache
   */
  async hasCachedVideo(videoId: string): Promise<boolean> {
    try {
      await this.init();
      const video = await this.getFromStore(videoId);
      return video !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Limpar vídeos antigos usando estratégia LRU
   */
  async ensureSpaceAvailable(requiredSize: number): Promise<void> {
    const stats = await this.getCacheStats();
    
    // Verificar limite de vídeos
    if (stats.videoCount >= MAX_VIDEO_COUNT) {
      await this.removeOldestVideo();
    }

    // Verificar limite de tamanho
    if (stats.totalSize + requiredSize > MAX_CACHE_SIZE) {
      while (stats.totalSize + requiredSize > MAX_CACHE_SIZE) {
        await this.removeOldestVideo();
        const newStats = await this.getCacheStats();
        if (newStats.videoCount === 0) break;
        stats.totalSize = newStats.totalSize;
      }
    }
  }

  /**
   * Remover vídeo mais antigo (LRU)
   */
  private async removeOldestVideo(): Promise<void> {
    try {
      await this.init();
      if (!this.db) return;

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('lastAccessedAt');
      const request = index.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) cursor.delete();
      };
    } catch (error) {
      // Silent fail
    }
  }

  /**
   * Obter estatísticas do cache
   */
  async getCacheStats(): Promise<CacheStats> {
    try {
      await this.init();
      if (!this.db) {
        return { totalSize: 0, videoCount: 0, videos: [] };
      }

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          const videos: CachedVideo[] = request.result;
          resolve({
            totalSize: videos.reduce((sum, v) => sum + v.size, 0),
            videoCount: videos.length,
            videos: videos.map(v => ({
              videoId: v.videoId,
              size: v.size,
              cachedAt: new Date(v.cachedAt),
              lastAccessedAt: new Date(v.lastAccessedAt)
            }))
          });
        };

        request.onerror = () => reject(request.error);
      });

    } catch (error) {
      return { totalSize: 0, videoCount: 0, videos: [] };
    }
  }

  /**
   * Limpar todo o cache
   */
  async clearCache(): Promise<void> {
    try {
      await this.init();
      if (!this.db) return;

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      await store.clear();
    } catch (error) {
      // Silent fail
    }
  }

  /**
   * Salvar no store
   */
  private async saveToStore(video: CachedVideo): Promise<void> {
    if (!this.db) throw new Error('DB não inicializado');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(video);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Obter do store
   */
  private async getFromStore(videoId: string): Promise<CachedVideo | null> {
    if (!this.db) throw new Error('DB não inicializado');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(videoId);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }
}

// Singleton instance
export const videoCache = new VideoCache();
