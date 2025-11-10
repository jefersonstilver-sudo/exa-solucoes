import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useBuildingActiveVideos } from '@/hooks/useBuildingActiveVideos';
import { supabase } from '@/integrations/supabase/client';
import { useNetworkMonitor } from '@/hooks/useNetworkMonitor';

const BuildingDisplayPanel = () => {
  const { buildingId } = useParams<{ buildingId: string }>();
  const { videos: activeVideos, loading, refetch } = useBuildingActiveVideos(buildingId || '');
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [buildingName, setBuildingName] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const nextVideoRef = useRef<HTMLVideoElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout>();
  const lastVideoCountRef = useRef(0);
  const networkStatus = useNetworkMonitor();

  // Preload próximo vídeo
  const nextVideoIndex = (selectedVideoIndex + 1) % activeVideos.length;
  const nextVideo = activeVideos[nextVideoIndex];

  // Buscar nome do prédio
  useEffect(() => {
    const fetchBuildingName = async () => {
      if (!buildingId) return;
      
      const { data, error } = await supabase
        .from('buildings')
        .select('nome')
        .eq('id', buildingId)
        .single();
      
      if (data && !error) {
        setBuildingName(data.nome);
      }
    };

    fetchBuildingName();
  }, [buildingId]);

  // Sistema de polling para verificar novos vídeos a cada 10 segundos
  useEffect(() => {
    console.log('🔌 [DISPLAY PANEL] Iniciando sistema de polling...');
    
    pollingIntervalRef.current = setInterval(async () => {
      try {
        console.log('🔄 [DISPLAY PANEL] Verificando atualizações...');
        await refetch();
        
        // Detectar mudanças na playlist
        if (activeVideos.length !== lastVideoCountRef.current) {
          console.log(`📊 [DISPLAY PANEL] Mudança detectada: ${lastVideoCountRef.current} → ${activeVideos.length} vídeos`);
          lastVideoCountRef.current = activeVideos.length;
        }
      } catch (error) {
        console.error('❌ [DISPLAY PANEL] Erro ao verificar atualizações:', error);
      }
    }, 10000); // Verificar a cada 10 segundos

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        console.log('🔌 [DISPLAY PANEL] Sistema de polling desligado');
      }
    };
  }, [refetch, activeVideos.length]);

  // Atualizar contagem de vídeos
  useEffect(() => {
    lastVideoCountRef.current = activeVideos.length;
  }, [activeVideos.length]);

  // Auto-avançar com loop infinito - transição imediata e suave
  useEffect(() => {
    const video = videoRef.current;
    if (!video || activeVideos.length === 0) return;

    const handleVideoEnd = () => {
      const nextIndex = (selectedVideoIndex + 1) % activeVideos.length;
      setSelectedVideoIndex(nextIndex);
    };

    // Garantir que o vídeo sempre carrega e reproduz sem lag
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

  // Loading - sem mostrar para evitar lag visual
  if (loading && activeVideos.length === 0) {
    return (
      <div className="min-h-screen bg-black" />
    );
  }

  // Sem vídeos - tela preta limpa
  if (activeVideos.length === 0) {
    return (
      <div className="min-h-screen bg-black" />
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      {/* Player fullscreen limpo - SEM NENHUMA INFORMAÇÃO */}
      <div className="w-full h-screen flex items-center justify-center">
        {selectedVideo && (
          <video
            ref={videoRef}
            key={selectedVideo.video_url}
            src={selectedVideo.video_url}
            className="w-full h-full object-contain bg-black"
            autoPlay
            muted
            playsInline
            preload="auto"
          >
            Seu navegador não suporta vídeo.
          </video>
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
    </div>
  );
};

export default BuildingDisplayPanel;
