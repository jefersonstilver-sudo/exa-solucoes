import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useBuildingActiveVideos } from '@/hooks/useBuildingActiveVideos';

/**
 * 🎬 EMBED PLAYER - Link Limpo (Fullscreen)
 * Baseado na lógica robusta do link comercial
 * Sem marca d'água, sem UI, apenas vídeo fullscreen em loop infinito
 */

interface BuildingDisplayEmbedProps {
  buildingId?: string;
}

const BuildingDisplayEmbed: React.FC<BuildingDisplayEmbedProps> = ({ buildingId: propBuildingId }) => {
  const params = useParams<{ buildingId: string }>();
  const buildingId = propBuildingId || params.buildingId || '';
  const { videos: activeVideos, refetch } = useBuildingActiveVideos(buildingId);
  
  // Estados simples
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isBuffering, setIsBuffering] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Refs para callbacks (evitar re-renders)
  const refetchRef = useRef(refetch);
  const currentIndexRef = useRef(currentIndex);
  const videosRef = useRef(activeVideos);

  // Atualizar refs
  useEffect(() => {
    refetchRef.current = refetch;
    currentIndexRef.current = currentIndex;
    videosRef.current = activeVideos;
  }, [refetch, currentIndex, activeVideos]);

  // Hash estável para detectar mudanças na playlist
  const videosHash = useMemo(() => {
    return activeVideos.map(v => v.video_id).sort().join(',');
  }, [activeVideos]);

  // Rastrear hash anterior
  const previousHashRef = useRef(videosHash);

  // Reset APENAS quando hash REALMENTE mudar
  useEffect(() => {
    if (previousHashRef.current !== videosHash && activeVideos.length > 0) {
      console.log('🔄 [EMBED] Playlist mudou - reiniciando');
      setCurrentIndex(0);
      setIsBuffering(true);
      previousHashRef.current = videosHash;
    }
  }, [videosHash, activeVideos.length]);

  // Event handlers TOTALMENTE estáveis - SEM dependências
  const handleLoadStart = useCallback(() => {
    setIsBuffering(true);
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    console.log('📊 [EMBED] Metadados carregados:', video.duration.toFixed(1) + 's');
  }, []);

  const handlePlaying = useCallback(() => {
    console.log('▶️ [EMBED] Reproduzindo');
    setIsBuffering(false);
  }, []);

  const handleEnded = useCallback(() => {
    console.log('✅ [EMBED] Vídeo terminou - próximo');
    
    // GARANTIR LOOP INFINITO: Sempre avança para o próximo vídeo
    setCurrentIndex(prev => {
      const nextIndex = (prev + 1) % videosRef.current.length;
      
      if (nextIndex === 0) {
        console.log('🔄 [EMBED] Ciclo completo - reiniciando playlist');
        // Refetch ao completar ciclo (silencioso)
        refetchRef.current().catch(() => {});
      }
      
      return nextIndex;
    });
  }, []);

  const handleError = useCallback((e: Event) => {
    console.error('❌ [EMBED] Erro no vídeo - pulando');
    
    // Fallback: tentar próximo vídeo após delay
    setTimeout(() => {
      setCurrentIndex(prev => (prev + 1) % videosRef.current.length);
    }, 2000);
  }, []);

  const handleWaiting = useCallback(() => {
    setIsBuffering(true);
  }, []);

  const handleCanPlay = useCallback(() => {
    setIsBuffering(false);
  }, []);

  // Configurar event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeVideos[currentIndex]) return;

    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);

    // Tentar reproduzir
    const playVideo = async () => {
      try {
        await video.play();
      } catch (err) {
        console.error('❌ [EMBED] Erro ao reproduzir:', err);
      }
    };

    playVideo();

    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [currentIndex, activeVideos, handleLoadStart, handleLoadedMetadata, handlePlaying, handleEnded, handleError, handleWaiting, handleCanPlay]);

  // Proteção contra menu de contexto
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

  // Loading State
  if (activeVideos.length === 0) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="text-white text-lg">Carregando...</div>
      </div>
    );
  }

  const currentVideo = activeVideos[currentIndex];

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      {/* Vídeo Atual - FULLSCREEN */}
      <video
        ref={videoRef}
        src={currentVideo.video_url}
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

      {/* Overlay de proteção (invisível) */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none'
        }}
      />

      {/* Loading indicator (opcional - pode remover) */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
          <div className="text-white text-sm">Carregando...</div>
        </div>
      )}
    </div>
  );
};

export default BuildingDisplayEmbed;
