import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useBuildingActiveVideos } from '@/hooks/useBuildingActiveVideos';
import { supabase } from '@/integrations/supabase/client';
import exaLogo from '@/assets/exa-logo.png';
import { CommercialVideoHero } from '@/components/commercial/CommercialVideoHero';
import { useVideoProtection } from '@/hooks/useVideoProtection';
import WeatherFooter from '@/components/public/WeatherFooter';
import { LiveClock } from '@/components/commercial/LiveClock';
import { useRealtimeConnection } from '@/hooks/useRealtimeConnection';
import { ConnectionStatusIndicator } from '@/components/commercial/ConnectionStatusIndicator';
import { VideoDebugger } from '@/utils/videoDebugger';

interface BuildingDisplayCommercialProps {
  buildingId?: string;
}

const BuildingDisplayCommercial: React.FC<BuildingDisplayCommercialProps> = ({ buildingId: propBuildingId }) => {
  const params = useParams<{ buildingId: string }>();
  const rawBuildingId = propBuildingId || params.buildingId || '';
  const isPlayingRef = useRef(false);
  const isCheckingRef = useRef(false);

  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  VideoDebugger.logEvent('ROUTING', 'Debug de rota', {
    propBuildingId,
    paramsKeys: Object.keys(params),
    paramsBuildingId: params.buildingId,
    rawBuildingId,
    currentPath: window.location.pathname,
    isValidUUID: UUID_REGEX.test(rawBuildingId),
    isLiteralString: rawBuildingId.startsWith(':')
  });

  if (rawBuildingId === ':buildingId' || rawBuildingId.startsWith(':')) {
    VideoDebugger.logEvent('ROUTING', 'ERRO: BuildingId é string literal', { rawBuildingId });
    return <Navigate to="/404" replace />;
  }

  if (rawBuildingId && !UUID_REGEX.test(rawBuildingId)) {
    VideoDebugger.logEvent('ROUTING', 'ERRO: BuildingId inválido', { rawBuildingId });
    return <Navigate to="/404" replace />;
  }

  const buildingId = rawBuildingId;
  
  const { videos: activeVideos, loading, refetch } = useBuildingActiveVideos(buildingId);
  const [buildingName, setBuildingName] = useState('');
  const [lastCheckTime, setLastCheckTime] = useState<Date>(new Date());
  
  const activeVideoIds = useMemo(() => 
    activeVideos.map(v => v.video_id).sort().join(','),
    [activeVideos]
  );

  VideoDebugger.logEvent('DISPLAY', 'Vídeos recebidos', {
    count: activeVideos.length,
    videoIds: activeVideoIds
  });
  
  // Status de conexão em tempo real (apenas para indicador visual)
  const connectionStatus = useRealtimeConnection(buildingId);
  
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

  useEffect(() => {
    if (!buildingId) return;

    VideoDebugger.logEvent('POLLING', 'Sistema iniciado (2 minutos)');

    const checkForUpdates = async () => {
      if (isPlayingRef.current) {
        VideoDebugger.logEvent('POLLING', 'Pulando - vídeo reproduzindo');
        return;
      }

      if (isCheckingRef.current) {
        VideoDebugger.logEvent('POLLING', 'Pulando - verificação em andamento');
        return;
      }

      isCheckingRef.current = true;

      try {
        const currentVideoIds = activeVideos
          .map(v => v.video_id)
          .sort()
          .join(',');

        VideoDebugger.logEvent('POLLING', 'Verificando atualizações', {
          currentCount: activeVideos.length,
          currentIds: currentVideoIds
        });

        await refetch();
        setLastCheckTime(new Date());
        
        VideoDebugger.logEvent('POLLING', 'Verificação concluída');
      } catch (error) {
        VideoDebugger.logEvent('POLLING', 'Erro ao verificar', { 
          error: error instanceof Error ? error.message : 'Erro desconhecido' 
        });
      } finally {
        isCheckingRef.current = false;
      }
    };

    const interval = setInterval(checkForUpdates, 120000);

    return () => {
      VideoDebugger.logEvent('POLLING', 'Sistema encerrado');
      clearInterval(interval);
    };
  }, [buildingId, refetch]);


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

          {/* Status de conexão em tempo real */}
          <ConnectionStatusIndicator status={connectionStatus} />
        </div>
      </header>

      {/* 🎯 Layout 100% responsivo - Mobile até TV 70" */}
      <main className="fixed inset-0 pt-12 sm:pt-14 md:pt-16 lg:pt-20 overflow-hidden">
        <div className="h-full w-full flex flex-col p-2 sm:p-3 md:p-4 lg:p-6 xl:p-8 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
          
          {/* 📺 Vídeo principal - 60% da altura */}
          <div className="flex-[60] min-h-0 w-full">
            <div className="h-full w-full bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-md rounded-lg sm:rounded-xl md:rounded-2xl shadow-2xl border border-white/5 overflow-hidden">
              {activeVideos.length > 0 ? (
                <CommercialVideoHero 
                  videos={activeVideos.map(v => ({
                    id: v.video_id || '',
                    video_url: v.video_url,
                    video_nome: v.video_name || ''
                  }))}
                  className="h-full w-full"
                  onPlayingChange={(playing) => {
                    isPlayingRef.current = playing;
                  }}
                  onPlaylistEnd={() => {
                    isPlayingRef.current = false;
                  }}
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
