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
      console.log('🗄️ [VIDEO CACHE] Inicializando IndexedDB...');
      
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('❌ [VIDEO CACHE] Erro ao abrir IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ [VIDEO CACHE] IndexedDB inicializado com sucesso');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'videoId' });
          store.createIndex('lastAccessedAt', 'lastAccessedAt', { unique: false });
          store.createIndex('cachedAt', 'cachedAt', { unique: false });
          console.log('🏗️ [VIDEO CACHE] Object store criado');
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
        console.log(`✅ [VIDEO CACHE] Vídeo ${videoId} já está em cache`);
        return true;
      }

      console.log(`📥 [VIDEO CACHE] Baixando vídeo ${videoId} para cache...`);
      
      // Baixar o vídeo
      const response = await fetch(videoUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const size = blob.size;

      console.log(`💾 [VIDEO CACHE] Vídeo baixado: ${(size / 1024 / 1024).toFixed(2)}MB`);

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
      
      console.log(`✅ [VIDEO CACHE] Vídeo ${videoId} armazenado com sucesso`);
      return true;

    } catch (error) {
      console.error(`❌ [VIDEO CACHE] Erro ao cachear vídeo ${videoId}:`, error);
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
      
      if (!cachedVideo) {
        return null;
      }

      // Atualizar lastAccessedAt
      cachedVideo.lastAccessedAt = Date.now();
      await this.saveToStore(cachedVideo);

      // Criar URL do blob
      const blobUrl = URL.createObjectURL(cachedVideo.blob);
      console.log(`✅ [VIDEO CACHE] Vídeo ${videoId} recuperado do cache`);
      
      return blobUrl;

    } catch (error) {
      console.error(`❌ [VIDEO CACHE] Erro ao recuperar vídeo ${videoId}:`, error);
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
      console.error(`❌ [VIDEO CACHE] Erro ao verificar cache:`, error);
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
      console.log(`🗑️ [VIDEO CACHE] Limite de ${MAX_VIDEO_COUNT} vídeos atingido, removendo mais antigo...`);
      await this.removeOldestVideo();
    }

    // Verificar limite de tamanho
    if (stats.totalSize + requiredSize > MAX_CACHE_SIZE) {
      console.log(`🗑️ [VIDEO CACHE] Limite de tamanho atingido, liberando espaço...`);
      
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
        if (cursor) {
          console.log(`🗑️ [VIDEO CACHE] Removendo vídeo ${cursor.value.videoId}`);
          cursor.delete();
        }
      };

    } catch (error) {
      console.error('❌ [VIDEO CACHE] Erro ao remover vídeo mais antigo:', error);
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
          
          const stats: CacheStats = {
            totalSize: videos.reduce((sum, v) => sum + v.size, 0),
            videoCount: videos.length,
            videos: videos.map(v => ({
              videoId: v.videoId,
              size: v.size,
              cachedAt: new Date(v.cachedAt),
              lastAccessedAt: new Date(v.lastAccessedAt)
            }))
          };

          resolve(stats);
        };

        request.onerror = () => reject(request.error);
      });

    } catch (error) {
      console.error('❌ [VIDEO CACHE] Erro ao obter estatísticas:', error);
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

      console.log('🗑️ [VIDEO CACHE] Cache limpo completamente');
    } catch (error) {
      console.error('❌ [VIDEO CACHE] Erro ao limpar cache:', error);
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
