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

export function useVideoCache(buildingId: string): UseVideoCacheResult {
  const [isCaching, setIsCaching] = useState(false);
  const [cacheStats, setCacheStats] = useState({ totalSize: 0, videoCount: 0 });

  useEffect(() => {
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
  }, []);

  const getCachedVideoUrl = async (videoId: string, originalUrl: string): Promise<string> => {
    try {
      const cachedUrl = await videoCache.getCachedVideo(videoId);
      
      if (cachedUrl) {
        console.log('[USE VIDEO CACHE] Usando video do cache:', videoId);
        return cachedUrl;
      }

      console.log('[USE VIDEO CACHE] Video nao esta em cache, usando URL original:', videoId);
      
      videoCache.cacheVideo(videoId, originalUrl).catch(err => {
        console.error('[USE VIDEO CACHE] Erro ao cachear:', videoId, err);
      });

      return originalUrl;

    } catch (error) {
      console.error('[USE VIDEO CACHE] Erro ao obter video:', videoId, error);
      return originalUrl;
    }
  };

  const preCacheVideos = (videos: BuildingActiveVideo[]) => {
    if (videos.length === 0 || isCaching) return;

    setIsCaching(true);
    console.log('[USE VIDEO CACHE] Pre-caching', videos.length, 'videos');

    const cacheAsync = async () => {
      try {
        const videosToCache = videos.slice(0, Math.min(3, videos.length));
        
        for (const video of videosToCache) {
          const hasCached = await videoCache.hasCachedVideo(video.video_id);
          
          if (!hasCached) {
            console.log('[USE VIDEO CACHE] Pre-caching:', video.video_name);
            await videoCache.cacheVideo(video.video_id, video.video_url);
          }
        }

        console.log('[USE VIDEO CACHE] Pre-cache completo');

        const stats = await videoCache.getCacheStats();
        setCacheStats({
          totalSize: stats.totalSize,
          videoCount: stats.videoCount
        });

      } catch (error) {
        console.error('[USE VIDEO CACHE] Erro no pre-cache:', error);
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
