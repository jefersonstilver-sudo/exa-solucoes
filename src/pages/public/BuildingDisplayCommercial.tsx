import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useBuildingActiveVideos } from '@/hooks/useBuildingActiveVideos';
import { supabase } from '@/integrations/supabase/client';
import exaLogo from '@/assets/exa-logo.png';
import WeatherFooter from '@/components/public/WeatherFooter';
import { Wifi, WifiOff } from 'lucide-react';
import { useNetworkMonitor } from '@/hooks/useNetworkMonitor';

interface BuildingDisplayCommercialProps {
  buildingId?: string;
}

const BuildingDisplayCommercial: React.FC<BuildingDisplayCommercialProps> = ({ buildingId: propBuildingId }) => {
  const params = useParams<{ buildingId: string }>();
  const buildingId = propBuildingId || params.buildingId || '';
  const { videos: activeVideos, loading, refetch } = useBuildingActiveVideos(buildingId);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [buildingName, setBuildingName] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const nextVideoRef = useRef<HTMLVideoElement>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const networkStatus = useNetworkMonitor();
  const pollingIntervalRef = useRef<NodeJS.Timeout>();
  const lastVideoCountRef = useRef(0);

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
    console.log('🔌 [DISPLAY COMMERCIAL] Iniciando sistema de polling...');
    
    pollingIntervalRef.current = setInterval(async () => {
      try {
        console.log('🔄 [DISPLAY COMMERCIAL] Verificando atualizações...');
        await refetch();
        
        // Detectar mudanças na playlist
        if (activeVideos.length !== lastVideoCountRef.current) {
          console.log(`📊 [DISPLAY COMMERCIAL] Mudança detectada: ${lastVideoCountRef.current} → ${activeVideos.length} vídeos`);
          lastVideoCountRef.current = activeVideos.length;
        }
      } catch (error) {
        console.error('❌ [DISPLAY COMMERCIAL] Erro ao verificar atualizações:', error);
      }
    }, 10000); // Verificar a cada 10 segundos

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        console.log('🔌 [DISPLAY COMMERCIAL] Sistema de polling desligado');
      }
    };
  }, [refetch, activeVideos.length]);

  // Atualizar contagem de vídeos
  useEffect(() => {
    lastVideoCountRef.current = activeVideos.length;
  }, [activeVideos.length]);

  // Auto-avançar com loop infinito - transição rápida e suave
  useEffect(() => {
    const video = videoRef.current;
    if (!video || activeVideos.length === 0) return;

    const handleVideoEnd = () => {
      setIsTransitioning(true);
      setTimeout(() => {
        const nextIndex = (selectedVideoIndex + 1) % activeVideos.length;
        setSelectedVideoIndex(nextIndex);
        setIsTransitioning(false);
      }, 150);
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

  // Sem vídeos
  if (activeVideos.length === 0) {
    return <div className="min-h-screen bg-black" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header premium com logo EXA */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-red-900 via-red-700 to-black shadow-2xl border-b border-white/10">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo EXA */}
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-auto">
              <div className="absolute inset-0 blur-lg bg-red-500/30 rounded-full" />
              <img 
                src={exaLogo} 
                alt="EXA" 
                className="h-10 w-auto relative z-10 drop-shadow-2xl brightness-110"
              />
            </div>
          </div>

          {/* Nome do prédio - centralizado */}
          {buildingName && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <h1 className="text-white text-lg font-semibold tracking-wide drop-shadow-lg">
                {buildingName}
              </h1>
            </div>
          )}

          {/* Status de conexão em tempo real */}
          <div className="flex items-center gap-2">
            {networkStatus.isOnline ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 rounded-full border border-green-500/30">
                <Wifi className="h-3.5 w-3.5 text-green-400 animate-pulse" />
                <span className="text-green-400 text-xs font-medium">
                  Conectado {networkStatus.downlink > 0 && `• ${networkStatus.downlink} Mbps`}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 rounded-full border border-red-500/30 animate-pulse">
                <WifiOff className="h-3.5 w-3.5 text-red-400" />
                <span className="text-red-400 text-xs font-medium">Offline</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Conteúdo principal com player horizontal REDUZIDO */}
      <main className="min-h-screen pt-16 pb-48 flex items-center justify-center p-6">
        <div className="w-full max-w-5xl">
          {/* Container do painel horizontal - simula monitor horizontal MENOR */}
          <div className="relative">
            {/* Moldura externa */}
            <div className="absolute -inset-4 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black rounded-2xl shadow-2xl" />
            
            {/* Moldura interna */}
            <div className="absolute -inset-2 bg-gradient-to-br from-zinc-900 to-black rounded-xl shadow-inner" />
            
            {/* Tela do painel - HORIZONTAL (16:9) COM ALTURA MÁXIMA REDUZIDA */}
            <div 
              className="relative bg-black rounded-lg overflow-hidden shadow-2xl" 
              style={{ 
                aspectRatio: '16/9',
                maxHeight: '60vh' // ALTURA MÁXIMA REDUZIDA
              }}
            >
              {/* Brilho da tela */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none z-20" />
              
              {/* Vídeo atual */}
              {selectedVideo && (
                <div className={`w-full h-full transition-opacity duration-150 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                  <video
                    ref={videoRef}
                    key={selectedVideo.video_url}
                    src={selectedVideo.video_url}
                    className="w-full h-full object-contain bg-black"
                    autoPlay
                    muted
                    playsInline
                    preload="auto"
                    style={{ pointerEvents: 'none' }}
                  >
                    Seu navegador não suporta vídeo.
                  </video>
                </div>
              )}
              
              {/* Reflexo sutil */}
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/[0.01] to-transparent pointer-events-none z-10" />
            </div>

            {/* Suporte/base do monitor - menor */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-24 h-3 bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-t-lg shadow-lg" />
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-36 h-2 bg-gradient-to-b from-zinc-900 to-black rounded-full shadow-xl" />
          </div>
        </div>
        
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
      </main>

      {/* Footer com meteorologia e status */}
      <WeatherFooter buildingName={buildingName} />
    </div>
  );
};

export default BuildingDisplayCommercial;
