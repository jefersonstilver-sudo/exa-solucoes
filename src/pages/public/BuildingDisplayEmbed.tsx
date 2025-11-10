import React, { useRef, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useBuildingActiveVideos } from '@/hooks/useBuildingActiveVideos';
import { useVideoCache } from '@/hooks/useVideoCache';
import { useVideoProtection } from '@/hooks/useVideoProtection';
import { useNetworkMonitor } from '@/hooks/useNetworkMonitor';
import { WifiOff } from 'lucide-react';

/**
 * 🎬 EMBED PLAYER - Link Limpo 
 * Versão minimalista para embed em outros sistemas
 * Sem UI, apenas vídeo em tela cheia com transições suaves
 */

interface BuildingDisplayEmbedProps {
  buildingId?: string;
}

const BuildingDisplayEmbed: React.FC<BuildingDisplayEmbedProps> = ({ buildingId: propBuildingId }) => {
  const params = useParams<{ buildingId: string }>();
  const buildingId = propBuildingId || params.buildingId || '';
  const { videos: activeVideos, loading, refetch } = useBuildingActiveVideos(buildingId);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [videosWithCache, setVideosWithCache] = useState<any[]>([]);
  const [showOfflineIndicator, setShowOfflineIndicator] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const nextVideoRef = useRef<HTMLVideoElement>(null);
  const hasEndedRef = useRef(false);
  const isTransitioningRef = useRef(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout>();
  const lastVideoCountRef = useRef(0);
  const networkStatus = useNetworkMonitor();
  const { getCachedVideoUrl, preCacheVideos } = useVideoCache(buildingId);
  const { containerRef: protectionRef } = useVideoProtection({
    preventDownload: true,
    preventPrint: true,
    preventDevTools: true,
    preventScreenCapture: true
  });

  const currentVideo = videosWithCache[currentIndex];
  const nextVideoIndex = (currentIndex + 1) % videosWithCache.length;
  const nextVideo = videosWithCache[nextVideoIndex];

  // ✅ Sistema de polling a cada 10 segundos
  useEffect(() => {
    console.log('🔌 [EMBED PLAYER] Iniciando sistema de polling...');
    
    const blockContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };
    
    document.addEventListener('contextmenu', blockContextMenu, { capture: true });
    
    pollingIntervalRef.current = setInterval(async () => {
      try {
        console.log('🔄 [EMBED PLAYER] Verificando atualizações...');
        await refetch();
        
        if (activeVideos.length !== lastVideoCountRef.current) {
          console.log(`📊 [EMBED PLAYER] Mudança detectada: ${lastVideoCountRef.current} → ${activeVideos.length} vídeos`);
          lastVideoCountRef.current = activeVideos.length;
        }
      } catch (error) {
        console.error('❌ [EMBED PLAYER] Erro ao verificar atualizações:', error);
      }
    }, 10000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        console.log('🔌 [EMBED PLAYER] Sistema de polling desligado');
      }
      document.removeEventListener('contextmenu', blockContextMenu, { capture: true } as any);
    };
  }, [refetch, activeVideos.length]);

  // ✅ Pre-cache de vídeos
  useEffect(() => {
    lastVideoCountRef.current = activeVideos.length;
    
    if (activeVideos.length > 0) {
      console.log('💾 [EMBED PLAYER] Pre-caching', activeVideos.length, 'vídeos');
      preCacheVideos(activeVideos);
    }
  }, [activeVideos, preCacheVideos]);

  // ✅ Carregar vídeos com cache
  useEffect(() => {
    if (activeVideos.length === 0) {
      setVideosWithCache([]);
      return;
    }

    const loadVideosWithCache = async () => {
      const videos = await Promise.all(
        activeVideos.map(async (video) => {
          const url = await getCachedVideoUrl(video.video_id, video.video_url);
          return {
            id: video.video_id || '',
            video_url: url,
            video_nome: video.video_name || ''
          };
        })
      );
      setVideosWithCache(videos);
      console.log('✅ [EMBED PLAYER]', videos.length, 'vídeos carregados');
    };

    loadVideosWithCache();
  }, [activeVideos, getCachedVideoUrl]);

  // ✅ Indicador offline por 5 segundos
  useEffect(() => {
    if (!networkStatus.isOnline) {
      setShowOfflineIndicator(true);
      const timer = setTimeout(() => setShowOfflineIndicator(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [networkStatus.isOnline]);

  // ✅ Reset playlist
  useEffect(() => {
    if (videosWithCache.length > 0 && currentIndex >= videosWithCache.length) {
      setCurrentIndex(0);
    }
  }, [videosWithCache.length, currentIndex]);

  // ✅ Gerenciar reprodução do vídeo atual
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentVideo) return;

    hasEndedRef.current = false;
    isTransitioningRef.current = false;
    setIsReady(false);

    console.log(`▶️ [EMBED PLAYER] Vídeo ${currentIndex + 1}/${videosWithCache.length}:`, currentVideo.video_nome);

    const handleLoadedData = () => {
      console.log('✅ [EMBED PLAYER] Vídeo carregado');
      setIsReady(true);
      // Forçar play após carregar
      video.play()
        .then(() => console.log('▶️ [EMBED PLAYER] Reprodução iniciada'))
        .catch(err => console.warn('⚠️ [EMBED PLAYER] Erro ao iniciar:', err));
    };

    const handleCanPlay = () => {
      video.play()
        .then(() => console.log('▶️ [EMBED PLAYER] Play executado'))
        .catch(err => console.warn('⚠️ [EMBED PLAYER] Erro no play:', err));
    };

    const handlePlaying = () => {
      console.log('🎬 [EMBED PLAYER] Reproduzindo');
      setIsReady(true);
    };

    const handleTimeUpdate = () => {
      if (!video || isTransitioningRef.current) return;
      
      const timeRemaining = video.duration - video.currentTime;
      
      // Pre-carregar próximo vídeo quando faltar 5 segundos
      if (timeRemaining <= 5 && timeRemaining > 4.5 && nextVideoRef.current) {
        console.log('⏭️ [EMBED PLAYER] Pre-carregando próximo vídeo');
        nextVideoRef.current.load();
      }
    };

    const handleEnded = () => {
      if (hasEndedRef.current || isTransitioningRef.current) {
        console.log('⚠️ [EMBED PLAYER] Evento duplicado ignorado');
        return;
      }

      hasEndedRef.current = true;
      isTransitioningRef.current = true;
      
      console.log('🔄 [EMBED PLAYER] Avançando para próximo vídeo');
      
      requestAnimationFrame(() => {
        setCurrentIndex(nextVideoIndex);
      });
    };

    const handleError = (e: Event) => {
      console.error('❌ [EMBED PLAYER] Erro ao carregar vídeo:', e);
      setTimeout(() => {
        if (!isTransitioningRef.current) {
          setCurrentIndex(nextVideoIndex);
        }
      }, 1000);
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    video.load();

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [currentIndex, currentVideo, nextVideoIndex, videosWithCache.length]);

  if (loading && activeVideos.length === 0) {
    return <div className="w-full h-full bg-black" />;
  }

  if (videosWithCache.length === 0) {
    return <div className="w-full h-full bg-black" />;
  }

  return (
    <div 
      ref={protectionRef}
      className="w-full h-full bg-black overflow-hidden"
      style={{
        margin: 0,
        padding: 0,
        userSelect: 'none',
        WebkitUserSelect: 'none'
      }}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      {/* Indicador Offline Discreto */}
      {showOfflineIndicator && !networkStatus.isOnline && (
        <div className="fixed top-2 right-2 z-50 bg-red-500/90 text-white px-3 py-1.5 rounded shadow-lg flex items-center gap-2 text-xs">
          <WifiOff className="h-3 w-3" />
          <span>Offline</span>
        </div>
      )}

      {/* Container do vídeo */}
      <div className="absolute inset-0 w-full h-full">
        {/* Vídeo principal */}
        <video
          key={`video-${currentIndex}-${currentVideo.id}`}
          ref={videoRef}
          src={currentVideo.video_url}
          className={`w-full h-full object-cover transition-opacity duration-200 ${
            isReady ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ 
            margin: 0,
            padding: 0,
            display: 'block',
            pointerEvents: 'none',
            userSelect: 'none'
          }}
          autoPlay
          muted
          playsInline
          preload="auto"
          controlsList="nodownload noplaybackrate nofullscreen"
          disablePictureInPicture
          disableRemotePlayback
          onContextMenu={(e) => e.preventDefault()}
        />

        {/* Loading placeholder */}
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="text-white text-sm opacity-50">Carregando...</div>
          </div>
        )}

        {/* Overlay de proteção invisível */}
        <div 
          className="absolute inset-0 z-50"
          style={{ 
            background: 'transparent',
            pointerEvents: 'auto',
            cursor: 'default'
          }}
          onContextMenu={(e) => e.preventDefault()}
          onMouseDown={(e) => e.button === 2 && e.preventDefault()}
        />
      </div>

      {/* Pre-load próximo vídeo (invisível) */}
      {nextVideo && (
        <video
          ref={nextVideoRef}
          src={nextVideo.video_url}
          className="hidden"
          preload="auto"
          muted
          playsInline
        />
      )}
    </div>
  );
};

export default BuildingDisplayEmbed;
