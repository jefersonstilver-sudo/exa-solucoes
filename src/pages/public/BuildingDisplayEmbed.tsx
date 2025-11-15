import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useBuildingActiveVideos } from '@/hooks/useBuildingActiveVideos';

/**
 * 🎬 EMBED PLAYER - Ultra Simples
 * Fullscreen, sem watermark, loop infinito
 */

interface BuildingDisplayEmbedProps {
  buildingId?: string;
}

const BuildingDisplayEmbed: React.FC<BuildingDisplayEmbedProps> = ({ buildingId: propBuildingId }) => {
  const params = useParams<{ buildingId: string }>();
  const buildingId = propBuildingId || params.buildingId || '';
  
  const { videos, loading, refetch } = useBuildingActiveVideos(buildingId);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Estados mínimos
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Debug logs
  console.log('🎬 [EMBED] Estado:', { 
    loading, 
    videosCount: videos.length, 
    buildingId,
    currentIndex
  });

  // EFFECT 1: Trocar vídeo quando index mudar
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videos[currentIndex]) return;

    video.src = videos[currentIndex].video_url;
    video.load();
    video.play().catch(() => {
      // Silenciar erro de autoplay
    });
  }, [currentIndex, videos]);

  // EFFECT 2: Event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video || videos.length === 0) return;

    // Quando vídeo termina → próximo
    const handleEnded = () => {
      const nextIndex = (currentIndex + 1) % videos.length;
      
      // Refetch silencioso ao completar ciclo
      if (nextIndex === 0) {
        refetch().catch(() => {});
      }
      
      setCurrentIndex(nextIndex);
    };

    // Se deu erro → próximo após delay
    const handleError = () => {
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % videos.length);
      }, 2000);
    };

    // Loading states
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [currentIndex, videos, refetch]);

  // Bloquear menu de contexto
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

  // Loading inicial
  if (loading) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="text-white text-lg">Carregando...</div>
      </div>
    );
  }

  // Sem vídeos disponíveis
  if (videos.length === 0) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="text-white text-lg">Aguardando conteúdo...</div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      {/* Vídeo fullscreen */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        muted
        playsInline
        preload="auto"
        crossOrigin="anonymous"
        style={{
          pointerEvents: 'none',
          userSelect: 'none'
        }}
      />

      {/* Overlay de proteção invisível */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none'
        }}
      />

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="text-white text-sm">Carregando...</div>
        </div>
      )}
    </div>
  );
};

export default BuildingDisplayEmbed;
