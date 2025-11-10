import React, { useRef, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useBuildingActiveVideos } from '@/hooks/useBuildingActiveVideos';
import { useVideoCache } from '@/hooks/useVideoCache';
import { supabase } from '@/integrations/supabase/client';
import exaLogo from '@/assets/exa-logo.png';
import { Wifi, WifiOff } from 'lucide-react';
import { useNetworkMonitor } from '@/hooks/useNetworkMonitor';
import { CommercialVideoHero } from '@/components/commercial/CommercialVideoHero';
import { useVideoProtection } from '@/hooks/useVideoProtection';
import WeatherFooter from '@/components/public/WeatherFooter';
import { LiveClock } from '@/components/commercial/LiveClock';

interface BuildingDisplayCommercialProps {
  buildingId?: string;
}

const BuildingDisplayCommercial: React.FC<BuildingDisplayCommercialProps> = ({ buildingId: propBuildingId }) => {
  const params = useParams<{ buildingId: string }>();
  const buildingId = propBuildingId || params.buildingId || '';
  const { videos: activeVideos, loading, refetch } = useBuildingActiveVideos(buildingId);
  const [buildingName, setBuildingName] = useState('');
  const [videosWithCache, setVideosWithCache] = useState<any[]>([]);
  const networkStatus = useNetworkMonitor();
  const pollingIntervalRef = useRef<NodeJS.Timeout>();
  const lastVideoCountRef = useRef(0);
  const { getCachedVideoUrl, preCacheVideos } = useVideoCache(buildingId);
  const { containerRef: protectionRef } = useVideoProtection({
    preventDownload: true,
    preventPrint: true,
    preventDevTools: true,
    preventScreenCapture: true
  });

  // Buscar dados do prédio
  useEffect(() => {
    const fetchBuildingData = async () => {
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

    fetchBuildingData();
  }, [buildingId]);

  // Sistema de polling para verificar novos vídeos a cada 10 segundos
  useEffect(() => {
    console.log('🔌 [DISPLAY COMMERCIAL] Iniciando sistema de polling...');
    
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
      // Remover proteção global ao sair
      document.removeEventListener('contextmenu', blockContextMenu, { capture: true } as any);
      document.removeEventListener('mousedown', blockRightClick, { capture: true } as any);
    };
  }, [refetch, activeVideos.length]);

  // Atualizar contagem de vídeos e pre-cachear
  useEffect(() => {
    lastVideoCountRef.current = activeVideos.length;
    
    if (activeVideos.length > 0) {
      console.log('[DISPLAY COMMERCIAL] Pre-caching videos...');
      preCacheVideos(activeVideos);
    }
  }, [activeVideos, preCacheVideos]);

  // Carregar videos com cache
  useEffect(() => {
    if (activeVideos.length === 0) {
      setVideosWithCache([]);
      console.log('[DISPLAY COMMERCIAL] No active videos');
      return;
    }

    console.log('[DISPLAY COMMERCIAL] Loading', activeVideos.length, 'videos with cache');

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
      console.log('[DISPLAY COMMERCIAL]', videos.length, 'videos loaded:', videos.map(v => v.video_nome));
    };

    loadVideosWithCache();
  }, [activeVideos, getCachedVideoUrl]);

  // Loading - sem mostrar para evitar lag visual
  if (loading && activeVideos.length === 0) {
    return (
      <div className="min-h-screen bg-black" />
    );
  }

  // Sem vídeos - mostrar mensagem informativa
  if (activeVideos.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="relative h-20 w-auto mb-6 inline-block">
            <img 
              src={exaLogo} 
              alt="EXA Mídia" 
              className="h-20 w-auto drop-shadow-2xl brightness-110"
            />
          </div>
          <h2 className="text-white text-2xl font-bold mb-3">
            {buildingName || 'Display Comercial'}
          </h2>
          <p className="text-gray-300 text-lg">
            Nenhum conteúdo disponível no momento
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Em breve novos vídeos estarão disponíveis
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={protectionRef} 
      className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        msUserSelect: 'none',
        MozUserSelect: 'none',
        WebkitTouchCallout: 'none',
        pointerEvents: 'auto'
      }}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      onDrop={(e) => e.preventDefault()}
    >
      {/* 📱 Header responsivo e adaptativo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-red-900/95 via-red-800/95 to-red-900/95 backdrop-blur-md shadow-2xl border-b border-white/10">
        <div className="container mx-auto px-2 sm:px-4 md:px-6 h-12 sm:h-14 md:h-16 lg:h-20 flex items-center justify-between">
          {/* Logo EXA - escalável */}
          <div className="flex items-center">
            <div className="relative h-6 sm:h-8 md:h-10 lg:h-12 w-auto">
              <div className="absolute inset-0 blur-xl bg-red-500/40 rounded-full animate-pulse" />
              <img 
                src={exaLogo} 
                alt="EXA Mídia" 
                className="h-full w-auto relative z-10 drop-shadow-2xl brightness-110"
              />
            </div>
          </div>

          {/* Nome do prédio - escalável */}
          {buildingName && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <h1 className="text-white text-sm sm:text-base md:text-xl lg:text-2xl xl:text-3xl font-bold tracking-wide drop-shadow-2xl">
                {buildingName}
              </h1>
            </div>
          )}

          {/* Status de conexão - escalável */}
          <div className="flex items-center">
            {networkStatus.isOnline ? (
              <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 bg-green-500/20 rounded-full border border-green-500/30">
                <Wifi className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-green-400" />
                <span className="text-green-400 text-xs sm:text-sm font-medium hidden sm:inline">Online</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 bg-red-500/20 rounded-full border border-red-500/30 animate-pulse">
                <WifiOff className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-red-400" />
                <span className="text-red-400 text-xs sm:text-sm font-medium hidden sm:inline">Offline</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 🎯 Layout 100% responsivo - Mobile até TV 70" */}
      <main className="fixed inset-0 pt-12 sm:pt-14 md:pt-16 lg:pt-20 overflow-hidden">
        <div className="h-full w-full flex flex-col p-2 sm:p-3 md:p-4 lg:p-6 xl:p-8 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
          
          {/* 📺 Vídeo principal - 60% da altura */}
          <div className="flex-[60] min-h-0 w-full">
            <div className="h-full w-full bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-md rounded-lg sm:rounded-xl md:rounded-2xl shadow-2xl border border-white/5 overflow-hidden">
              {videosWithCache.length > 0 ? (
                <CommercialVideoHero 
                  videos={videosWithCache}
                  className="h-full w-full"
                />
              ) : activeVideos.length > 0 ? (
                <CommercialVideoHero 
                  videos={activeVideos.map(v => ({
                    id: v.video_id || '',
                    video_url: v.video_url,
                    video_nome: v.video_name || ''
                  }))}
                  className="h-full w-full"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-white">Carregando...</div>
              )}
            </div>
          </div>

          {/* ⏰🌤️ Relógio e Clima - 40% da altura com grid responsivo */}
          <div className="flex-[40] min-h-0 w-full">
            <div className="h-full w-full grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
              {/* Relógio */}
              <div className="h-full min-h-0 w-full">
                <LiveClock />
              </div>

              {/* Clima */}
              <div className="h-full min-h-0 w-full">
                <WeatherFooter buildingName={buildingName} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BuildingDisplayCommercial;
