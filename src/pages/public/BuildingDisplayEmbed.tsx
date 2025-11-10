import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useBuildingActiveVideos } from '@/hooks/useBuildingActiveVideos';
import { supabase } from '@/integrations/supabase/client';
import { useVideoProtection } from '@/hooks/useVideoProtection';
import { useVideoCache } from '@/hooks/useVideoCache';
import { useNetworkMonitor } from '@/hooks/useNetworkMonitor';
import { WifiOff } from 'lucide-react';

/**
 * Embed player - versão totalmente limpa para embed em outros sistemas
 * Sem header, footer, bordas ou qualquer UI
 * Ideal para iframes, painéis de comunicação interna, etc.
 */

interface BuildingDisplayEmbedProps {
  buildingId?: string;
}

const BuildingDisplayEmbed: React.FC<BuildingDisplayEmbedProps> = ({ buildingId: propBuildingId }) => {
  const params = useParams<{ buildingId: string }>();
  const buildingId = propBuildingId || params.buildingId || '';
  const { videos: activeVideos, loading, refetch } = useBuildingActiveVideos(buildingId);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>('');
  const [videoError, setVideoError] = useState(false);
  const [showOfflineIndicator, setShowOfflineIndicator] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const nextVideoRef = useRef<HTMLVideoElement>(null);
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

  // Preload próximo vídeo
  const nextVideoIndex = (selectedVideoIndex + 1) % activeVideos.length;
  const nextVideo = activeVideos[nextVideoIndex];

  // Sistema de polling para verificar novos vídeos a cada 10 segundos
  useEffect(() => {
    console.log('🔌 [EMBED PLAYER] Iniciando sistema de polling...');
    
    // PROTEÇÃO GLOBAL - Bloquear contexto menu NO DOCUMENTO INTEIRO
    const blockContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    };
    
    const blockRightClick = (e: MouseEvent) => {
      if (e.button === 2) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
    };
    
    // Adicionar listeners com capture phase
    document.addEventListener('contextmenu', blockContextMenu, { capture: true });
    document.addEventListener('mousedown', blockRightClick, { capture: true });
    
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
      // Remover proteção global ao sair
      document.removeEventListener('contextmenu', blockContextMenu, { capture: true } as any);
      document.removeEventListener('mousedown', blockRightClick, { capture: true } as any);
    };
  }, [refetch, activeVideos.length]);

  // Atualizar contagem de vídeos e pre-cachear
  useEffect(() => {
    lastVideoCountRef.current = activeVideos.length;
    
    if (activeVideos.length > 0) {
      console.log('[EMBED PLAYER] Pre-caching videos...');
      preCacheVideos(activeVideos);
    }
  }, [activeVideos, preCacheVideos]);

  // Carregar video com cache quando mudar o indice
  useEffect(() => {
    if (activeVideos.length === 0) return;
    
    const loadVideo = async () => {
      const selectedVideo = activeVideos[selectedVideoIndex];
      if (!selectedVideo) return;

      try {
        setVideoError(false);
        const url = await getCachedVideoUrl(selectedVideo.video_id, selectedVideo.video_url);
        setCurrentVideoUrl(url);
        console.log('[EMBED PLAYER] Video carregado:', selectedVideo.video_name);
      } catch (error) {
        console.error('[EMBED PLAYER] Erro ao carregar video:', error);
        setVideoError(true);
      }
    };

    loadVideo();
  }, [selectedVideoIndex, activeVideos, getCachedVideoUrl]);

  // Mostrar indicador offline por 5 segundos
  useEffect(() => {
    if (!networkStatus.isOnline) {
      setShowOfflineIndicator(true);
      const timer = setTimeout(() => setShowOfflineIndicator(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [networkStatus.isOnline]);

  // Auto-avancar com loop infinito e error handling
  useEffect(() => {
    const video = videoRef.current;
    if (!video || activeVideos.length === 0) return;

    const handleVideoEnd = () => {
      const nextIndex = (selectedVideoIndex + 1) % activeVideos.length;
      setSelectedVideoIndex(nextIndex);
    };

    const handleCanPlay = () => {
      video.play().catch(err => console.log('[EMBED PLAYER] Autoplay prevented:', err));
    };

    const handleError = () => {
      console.error('[EMBED PLAYER] Erro ao reproduzir video, pulando para proximo...');
      setVideoError(true);
      setTimeout(() => {
        const nextIndex = (selectedVideoIndex + 1) % activeVideos.length;
        setSelectedVideoIndex(nextIndex);
      }, 1000);
    };

    video.addEventListener('ended', handleVideoEnd);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);
    
    return () => {
      video.removeEventListener('ended', handleVideoEnd);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
    };
  }, [selectedVideoIndex, activeVideos.length]);

  const selectedVideo = activeVideos[selectedVideoIndex];

  // Loading
  if (loading && activeVideos.length === 0) {
    return <div className="w-full h-full bg-black" />;
  }

  // Sem vídeos
  if (activeVideos.length === 0) {
    return <div className="w-full h-full bg-black" />;
  }

  return (
    <div 
      ref={protectionRef}
      className="w-full h-full bg-black select-none" 
      style={{ margin: 0, padding: 0, overflow: 'hidden' }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Indicador Offline Discreto */}
      {showOfflineIndicator && !networkStatus.isOnline && (
        <div className="fixed top-2 right-2 z-50 bg-red-500/90 text-white px-3 py-1.5 rounded shadow-lg flex items-center gap-2 text-xs">
          <WifiOff className="h-3 w-3" />
          <span>Offline</span>
        </div>
      )}

      {selectedVideo && currentVideoUrl && !videoError && (
        <div className="relative w-full h-full">
          <video
            ref={videoRef}
            key={currentVideoUrl}
            src={currentVideoUrl}
            className="w-full h-full object-contain select-none"
            style={{ margin: 0, padding: 0, display: 'block', pointerEvents: 'none' }}
            autoPlay
            muted
            playsInline
            preload="auto"
            controlsList="nodownload noplaybackrate"
            disablePictureInPicture
            disableRemotePlayback
            onContextMenu={(e) => e.preventDefault()}
          >
            Seu navegador não suporta vídeo.
          </video>
          
          {/* Overlay de proteção invisível - SEM marca d'água visível */}
          <div 
            className="absolute inset-0 z-50"
            style={{ 
              background: 'transparent',
              pointerEvents: 'auto',
              userSelect: 'none'
            }}
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
          />
        </div>
      )}
      
      {/* Preload do próximo vídeo (invisível) */}
      {nextVideo && (
        <video
          ref={nextVideoRef}
          src={nextVideo.video_url}
          preload="auto"
          muted
          playsInline
          className="hidden"
        />
      )}
    </div>
  );
};

export default BuildingDisplayEmbed;
