import React, { useRef, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useBuildingActiveVideos } from '@/hooks/useBuildingActiveVideos';

/**
 * 🎬 EMBED PLAYER OTIMIZADO - Link Limpo 
 * Versão minimalista e super leve
 * - UMA query otimizada no banco
 * - Sem polling agressivo (apenas ao fim da playlist)
 * - Sem proteções pesadas
 * - Sem cache IndexedDB
 * - Transições suaves
 */

interface BuildingDisplayEmbedProps {
  buildingId?: string;
}

const BuildingDisplayEmbed: React.FC<BuildingDisplayEmbedProps> = ({ buildingId: propBuildingId }) => {
  const params = useParams<{ buildingId: string }>();
  const buildingId = propBuildingId || params.buildingId || '';
  const { videos: activeVideos, refetch } = useBuildingActiveVideos(buildingId);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const nextVideoRef = useRef<HTMLVideoElement>(null);
  const lastRefetchRef = useRef<number>(0);
  const REFETCH_COOLDOWN = 30000; // 30 segundos

  const currentVideo = activeVideos[currentIndex];
  const nextVideoIndex = (currentIndex + 1) % activeVideos.length;
  const nextVideo = activeVideos[nextVideoIndex];

  // 🚫 Bloquear menu de contexto
  useEffect(() => {
    const blockContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };
    
    document.addEventListener('contextmenu', blockContextMenu, { capture: true });
    
    return () => {
      document.removeEventListener('contextmenu', blockContextMenu, { capture: true } as any);
    };
  }, []);

  // ✅ Reset se index inválido
  useEffect(() => {
    if (activeVideos.length > 0 && currentIndex >= activeVideos.length) {
      setCurrentIndex(0);
    }
  }, [activeVideos.length, currentIndex]);

  // ⚡ Refetch inteligente: APENAS ao finalizar toda a playlist
  const handlePlaylistEnd = async () => {
    const now = Date.now();
    
    // Cooldown para evitar refetch excessivo
    if (now - lastRefetchRef.current < REFETCH_COOLDOWN) {
      return;
    }
    
    lastRefetchRef.current = now;
    
    try {
      await refetch();
    } catch (error) {
      // Silencioso
    }
  };

  // 🎬 Gerenciar reprodução do vídeo atual
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentVideo) return;

    setIsReady(false);
    setIsTransitioning(false);

    const handleLoadedData = () => {
      setIsReady(true);
      video.play().catch(() => {});
    };

    const handleCanPlay = () => {
      video.play().catch(() => {});
    };

    const handlePlaying = () => {
      setIsReady(true);
    };

    const handleTimeUpdate = () => {
      if (!video || isTransitioning) return;
      
      const timeRemaining = video.duration - video.currentTime;
      
      // Pre-carregar próximo vídeo quando faltar 5 segundos
      if (timeRemaining <= 5 && timeRemaining > 4.5 && nextVideoRef.current && nextVideo) {
        nextVideoRef.current.load();
      }
    };

    const handleEnded = () => {
      if (isTransitioning) return;
      
      setIsTransitioning(true);
      
      // Se é o último vídeo da playlist, refetch antes de voltar ao início
      if (currentIndex === activeVideos.length - 1) {
        handlePlaylistEnd();
      }
      
      // Transição suave
      setTimeout(() => {
        setCurrentIndex((prevIndex) => {
          const nextIdx = (prevIndex + 1) % activeVideos.length;
          return nextIdx;
        });
        setIsTransitioning(false);
      }, 300);
    };

    const handleError = (e: Event) => {
      console.error('❌ [EMBED] Erro no vídeo:', e);
      // Fallback: tentar próximo vídeo
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % activeVideos.length);
      }, 2000);
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    // Iniciar carregamento
    video.load();

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [currentVideo, currentIndex, activeVideos.length, nextVideo, isTransitioning]);

  // 🎨 Loading State
  if (!currentVideo) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="text-white text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      {/* Vídeo Atual */}
      <video
        ref={videoRef}
        src={currentVideo.video_url}
        className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${
          isReady ? 'opacity-100' : 'opacity-0'
        }`}
        autoPlay
        muted
        playsInline
        preload="metadata"
        crossOrigin="anonymous"
        style={{
          pointerEvents: 'none',
          userSelect: 'none'
        }}
      />

      {/* Pre-load próximo vídeo (oculto) */}
      {nextVideo && (
        <video
          ref={nextVideoRef}
          src={nextVideo.video_url}
          className="hidden"
          preload="metadata"
          playsInline
          muted
          crossOrigin="anonymous"
        />
      )}

      {/* Overlay de proteção */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none'
        }}
      />
    </div>
  );
};

export default BuildingDisplayEmbed;
