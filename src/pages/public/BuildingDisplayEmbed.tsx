import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useBuildingActiveVideos } from '@/hooks/useBuildingActiveVideos';
import { supabase } from '@/integrations/supabase/client';
import { VideoWatermark } from '@/components/video-security/VideoWatermark';
import { useVideoProtection } from '@/hooks/useVideoProtection';

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const nextVideoRef = useRef<HTMLVideoElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout>();
  const lastVideoCountRef = useRef(0);
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
    };
  }, [refetch, activeVideos.length]);

  // Atualizar contagem de vídeos
  useEffect(() => {
    lastVideoCountRef.current = activeVideos.length;
  }, [activeVideos.length]);

  // Auto-avançar com loop infinito
  useEffect(() => {
    const video = videoRef.current;
    if (!video || activeVideos.length === 0) return;

    const handleVideoEnd = () => {
      const nextIndex = (selectedVideoIndex + 1) % activeVideos.length;
      setSelectedVideoIndex(nextIndex);
    };

    const handleCanPlay = () => {
      video.play().catch(err => console.log('Autoplay prevented:', err));
    };

    video.addEventListener('ended', handleVideoEnd);
    video.addEventListener('canplay', handleCanPlay);
    
    return () => {
      video.removeEventListener('ended', handleVideoEnd);
      video.removeEventListener('canplay', handleCanPlay);
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
      {selectedVideo && (
        <div className="relative w-full h-full">
          <video
            ref={videoRef}
            key={selectedVideo.video_url}
            src={selectedVideo.video_url}
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
          
          {/* MARCA D'ÁGUA - PROTEÇÃO ANTI-PIRATARIA */}
          <VideoWatermark />
          
          {/* Overlay de proteção invisível */}
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
