import { useState, useEffect } from 'react';
import { videoCache } from '@/utils/videoCache';
import { BuildingActiveVideo } from './useBuildingActiveVideos';

interface UseVideoCacheResult {
  getCachedVideoUrl: (videoId: string, originalUrl: string) => Promise<string>;
  preCacheVideos: (videos: BuildingActiveVideo[]) => void;
  isCaching: boolean;
  cacheStats: {
    totalSize: number;
    videoCount: number;
  };
}

interface UseVideoCacheOptions {
  enabled?: boolean;
}

export function useVideoCache(buildingId: string, options: UseVideoCacheOptions = {}): UseVideoCacheResult {
  const { enabled = true } = options;
  const [isCaching, setIsCaching] = useState(false);
  const [cacheStats, setCacheStats] = useState({ totalSize: 0, videoCount: 0 });

  useEffect(() => {
    if (!enabled) return;

    const updateStats = async () => {
      try {
        const stats = await videoCache.getCacheStats();
        setCacheStats({
          totalSize: stats.totalSize,
          videoCount: stats.videoCount
        });
      } catch (error) {
        console.error('[USE VIDEO CACHE] Erro ao atualizar stats:', error);
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 30000);

    return () => clearInterval(interval);
  }, [enabled]);

  const getCachedVideoUrl = async (videoId: string, originalUrl: string): Promise<string> => {
    if (!enabled) return originalUrl;
    
    try {
      const cachedUrl = await videoCache.getCachedVideo(videoId);
      if (cachedUrl) return cachedUrl;
      
      videoCache.cacheVideo(videoId, originalUrl).catch(() => {});
      return originalUrl;

    } catch (error) {
      return originalUrl;
    }
  };

  const preCacheVideos = (videos: BuildingActiveVideo[]) => {
    if (!enabled || videos.length === 0 || isCaching) return;

    setIsCaching(true);

    const cacheAsync = async () => {
      try {
        const videosToCache = videos.slice(0, Math.min(10, videos.length));
        
        for (const video of videosToCache) {
          const hasCached = await videoCache.hasCachedVideo(video.video_id);
          if (!hasCached) {
            await videoCache.cacheVideo(video.video_id, video.video_url);
          }
        }

        const stats = await videoCache.getCacheStats();
        setCacheStats({
          totalSize: stats.totalSize,
          videoCount: stats.videoCount
        });

      } catch (error) {
        // Silent fail
      } finally {
        setIsCaching(false);
      }
    };

    cacheAsync();
  };

  return {
    getCachedVideoUrl,
    preCacheVideos,
    isCaching,
    cacheStats
  };
}
