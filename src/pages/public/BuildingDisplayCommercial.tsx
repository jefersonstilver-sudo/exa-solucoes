import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useBuildingActiveVideos } from '@/hooks/useBuildingActiveVideos';
import { supabase } from '@/integrations/supabase/client';
import exaLogo from '@/assets/exa-logo.png';
import { CommercialVideoHero } from '@/components/commercial/CommercialVideoHero';
import { CommercialLoadingScreen } from '@/components/commercial/CommercialLoadingScreen';
import { useVideoProtection } from '@/hooks/useVideoProtection';
import WeatherFooter from '@/components/public/WeatherFooter';
import { LiveClock } from '@/components/commercial/LiveClock';
import { useRealtimeConnection } from '@/hooks/useRealtimeConnection';
import { ConnectionStatusIndicator } from '@/components/commercial/ConnectionStatusIndicator';
import { VideoDebugger } from '@/utils/videoDebugger';
import { useBuildingScheduleMonitor } from '@/hooks/useBuildingScheduleMonitor';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { UpdateIndicator } from '@/components/display/UpdateIndicator';
import { usePendingPlaylistUpdates } from '@/hooks/usePendingPlaylistUpdates';

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
  
  const { videos: activeVideos, loading, isUpdating, refetch } = useBuildingActiveVideos(buildingId);
  
  // 📦 SISTEMA DE PENDING UPDATES - Atualizações só aplicam no fim do ciclo
  const {
    hasPendingUpdates,
    setPendingUpdate,
    applyPendingUpdates,
    updateCurrentHash,
    pendingVideosCount
  } = usePendingPlaylistUpdates<typeof activeVideos[0]>({
    getPlaylistHash: (videos) => videos.map(v => v.video_id).sort().join(',')
  });
  
  // 🔥 CACHE OFFLINE: Salvar última playlist válida para reprodução contínua sem internet
  const [cachedVideos, setCachedVideos] = useState<typeof activeVideos>([]);
  
  // 🎬 Playlist atual em reprodução (pode ser diferente de activeVideos se houver pending)
  const [currentPlaylist, setCurrentPlaylist] = useState<typeof activeVideos>([]);
  
  // ✅ Atualizar cache sempre que novos vídeos chegam
  useEffect(() => {
    if (activeVideos.length > 0) {
      VideoDebugger.logEvent('CACHE', 'Salvando playlist offline', { count: activeVideos.length });
      setCachedVideos(activeVideos);
    }
  }, [activeVideos]);
  
  // ✅ Usar cache quando offline (NUNCA parar o player)
  const displayVideos = useMemo(() => {
    // Se tem playlist atual em reprodução, usar ela
    if (currentPlaylist.length > 0) {
      return currentPlaylist;
    }
    
    // Senão, tentar usar activeVideos
    if (activeVideos.length > 0) {
      return activeVideos;
    }
    
    // Último recurso: cache offline
    if (cachedVideos.length > 0) {
      VideoDebugger.logEvent('CACHE', 'Usando playlist em cache (offline)', { count: cachedVideos.length });
      return cachedVideos;
    }
    
    return [];
  }, [currentPlaylist, activeVideos, cachedVideos]);
  
  const [buildingName, setBuildingName] = useState('');
  const [lastCheckTime, setLastCheckTime] = useState<Date>(new Date());
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  
  // ✅ CORREÇÃO 1: Ref estável para refetch
  const refetchRef = useRef(refetch);
  const playlistCycleInProgress = useRef(false);
  
  useEffect(() => {
    refetchRef.current = refetch;
  }, [refetch]);
  
  // 🎯 Inicializar playlist atual quando activeVideos chegar pela primeira vez
  useEffect(() => {
    if (activeVideos.length > 0 && currentPlaylist.length === 0) {
      console.log('🎬 [INIT] Inicializando primeira playlist:', activeVideos.length, 'vídeos');
      setCurrentPlaylist(activeVideos);
      updateCurrentHash(activeVideos);
    }
  }, [activeVideos, currentPlaylist.length, updateCurrentHash]);
  
  // 📦 Quando activeVideos mudar, salvar em pending (NÃO aplicar imediatamente)
  useEffect(() => {
    if (activeVideos.length > 0 && currentPlaylist.length > 0) {
      const currentHash = currentPlaylist.map(v => v.video_id).sort().join(',');
      const newHash = activeVideos.map(v => v.video_id).sort().join(',');
      
      if (currentHash !== newHash) {
        console.log('📦 [UPDATE] Nova playlist detectada - salvando em pending');
        setPendingUpdate(activeVideos);
      }
    }
  }, [activeVideos, currentPlaylist, setPendingUpdate]);

  const activeVideoIds = useMemo(() => 
    displayVideos.map(v => v.video_id).sort().join(','),
    [displayVideos]
  );

  VideoDebugger.logEvent('DISPLAY', 'Vídeos em exibição', {
    count: displayVideos.length,
    videoIds: activeVideoIds,
    hasPending: hasPendingUpdates,
    pendingCount: pendingVideosCount,
    usingCache: activeVideos.length === 0 && displayVideos.length > 0
  });
  
  // Callbacks estáveis para evitar re-renders infinitos
  const handlePlayingChange = useCallback((playing: boolean) => {
    isPlayingRef.current = playing;
    playlistCycleInProgress.current = playing;
  }, []);

  // 🎯 Aplicar pending updates APENAS quando ciclo completo terminar
  const handlePlaylistEnd = useCallback(() => {
    isPlayingRef.current = false;
    playlistCycleInProgress.current = false;
    
    console.group('🎯 [CYCLE END] Ciclo da playlist completo');
    console.log('📦 Tem pending updates?', hasPendingUpdates);
    
    if (hasPendingUpdates) {
      const newPlaylist = applyPendingUpdates();
      if (newPlaylist && newPlaylist.length > 0) {
        console.log('✅ Aplicando nova playlist:', newPlaylist.length, 'vídeos');
        setCurrentPlaylist(newPlaylist);
        console.groupEnd();
        return;
      }
    }
    
    console.log('🔁 Sem updates - recomeçando mesma playlist');
    console.groupEnd();
  }, [hasPendingUpdates, applyPendingUpdates]);
  
  // 📦 Callback quando vídeos externos mudarem (salva em pending)
  const handleVideosChange = useCallback((newVideos: any[]) => {
    console.log('📦 [VIDEOS CHANGE] Novos vídeos disponíveis - salvando em pending');
    // Já é gerenciado pelo useEffect de activeVideos, mas mantém a assinatura
  }, []);
  
  // Status de conexão em tempo real (apenas para indicador visual)
  const connectionStatus = useRealtimeConnection(buildingId);
  
  // Monitor de agendamentos - verifica a cada 1 minuto se algum vídeo deve entrar/sair
  useBuildingScheduleMonitor({
    buildingId,
    onScheduleChange: () => {
      VideoDebugger.logEvent('SCHEDULE', 'Mudança de agendamento detectada - forçando atualização');
      refetchRef.current();
    },
    intervalMinutes: 1,
    enabled: true
  });
  
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

  // Generate dynamic manifest for specific building URL
  useEffect(() => {
    if (!buildingName) return;
    
    const currentUrl = window.location.href;
    const manifest = {
      name: `EXA Display - ${buildingName}`,
      short_name: `EXA ${buildingName}`,
      description: `Display comercial - ${buildingName}`,
      start_url: currentUrl,
      scope: currentUrl,
      display: "fullscreen",
      orientation: "landscape",
      background_color: "#0F172A",
      theme_color: "#FF4430",
      icons: [
        {
          src: "/favicon.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable"
        }
      ]
    };

    const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
    const manifestURL = URL.createObjectURL(manifestBlob);
    
    const existingManifest = document.querySelector('link[rel="manifest"]');
    if (existingManifest) existingManifest.remove();
    
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = manifestURL;
    document.head.appendChild(link);

    console.log('Dynamic manifest for:', currentUrl);
    
    return () => URL.revokeObjectURL(manifestURL);
  }, [buildingName]);

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

  // PWA: Capturar evento de instalação
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      VideoDebugger.logEvent('PWA', 'Prompt de instalação disponível');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Verificar se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      VideoDebugger.logEvent('PWA', 'App já instalado');
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // PWA: Fullscreen automático em modo kiosk
  useEffect(() => {
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  window.matchMedia('(display-mode: fullscreen)').matches;
    
    if (isPWA && !isInstalled) {
      setIsInstalled(true);
    }

    if (isPWA) {
      VideoDebugger.logEvent('PWA', 'Modo kiosk ativado');
      
      const enterFullscreen = () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen?.().catch(err => {
            VideoDebugger.logEvent('PWA', 'Erro fullscreen', { error: err });
          });
        }
      };

      setTimeout(enterFullscreen, 500);

      const handleFullscreenChange = () => {
        if (!document.fullscreenElement && isPWA) {
          setTimeout(enterFullscreen, 500);
        }
      };

      const preventKeys = (e: KeyboardEvent) => {
        if (e.key === 'Escape' || e.key === 'F11') {
          e.preventDefault();
        }
      };

      document.addEventListener('fullscreenchange', handleFullscreenChange);
      document.addEventListener('keydown', preventKeys);

      return () => {
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
        document.removeEventListener('keydown', preventKeys);
      };
    }
  }, [isInstalled]);

  // Handler de instalação PWA
  const handleInstall = async () => {
    if (!deferredPrompt) {
      toast.error('Instalação não disponível neste momento');
      return;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        toast.success('App instalado com sucesso!');
        setIsInstalled(true);
        VideoDebugger.logEvent('PWA', 'App instalado pelo usuário');
      } else {
        toast.info('Instalação cancelada');
        VideoDebugger.logEvent('PWA', 'Instalação cancelada pelo usuário');
      }
      
      setDeferredPrompt(null);
    } catch (error) {
      VideoDebugger.logEvent('PWA', 'Erro na instalação', { error });
      toast.error('Erro ao instalar o app');
    }
  };

  // ✅ CORREÇÃO 1: Polling com refetch estável via ref (salva em pending)
  useEffect(() => {
    if (!buildingId) return;

    VideoDebugger.logEvent('POLLING', 'Sistema iniciado (2 minutos)');

    const checkForUpdates = async () => {
      if (isCheckingRef.current) {
        VideoDebugger.logEvent('POLLING', 'Pulando - verificação em andamento');
        return;
      }

      isCheckingRef.current = true;

      try {
        const currentVideoIds = displayVideos
          .map(v => v.video_id)
          .sort()
          .join(',');

        VideoDebugger.logEvent('POLLING', 'Verificando atualizações', {
          currentCount: displayVideos.length,
          currentIds: currentVideoIds
        });

        await refetchRef.current(); // ✅ Busca novos dados (irão para pending automaticamente)
        setLastCheckTime(new Date());
        
        VideoDebugger.logEvent('POLLING', 'Verificação concluída - mudanças salvas em pending');
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
  }, [buildingId, displayVideos]); // ✅ Incluir displayVideos para comparação


  // Loading - Tela profissional enquanto busca vídeos
  if (loading && activeVideos.length === 0) {
    return <CommercialLoadingScreen buildingName={buildingName} />;
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
      {/* Indicador de Atualização */}
      <UpdateIndicator isUpdating={isUpdating} videosCount={activeVideos.length} />
      
      {/* Indicador de Conexão */}
      <ConnectionStatusIndicator status={connectionStatus} />
      
      {/* Botão de Instalar (apenas se não instalado e há prompt) */}
      {!isInstalled && deferredPrompt && (
        <button
          onClick={handleInstall}
          className="fixed top-4 left-4 z-50 bg-primary text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 hover:bg-primary/90 transition-all animate-in fade-in slide-in-from-left"
        >
          <Download className="h-4 w-4" />
          <span className="text-sm font-medium">Instalar App</span>
        </button>
      )}
      
      {/* 📱 Header responsivo e adaptativo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-red-900/95 via-red-800/95 to-red-900/95 backdrop-blur-md shadow-2xl border-b border-white/10 pt-[env(safe-area-inset-top,0px)]">
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

          {/* Botão de instalação PWA */}
          <div className="flex items-center gap-2 sm:gap-3">
            {deferredPrompt && !isInstalled && (
              <button
                onClick={handleInstall}
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg transition-all duration-300 border border-white/20 hover:border-white/40 group"
                title="Instalar aplicativo"
              >
                <Download className="w-3 h-3 sm:w-4 sm:h-4 text-white group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline text-white text-xs sm:text-sm font-medium">
                  Instalar
                </span>
              </button>
            )}
            
            {/* Status de conexão em tempo real */}
            <ConnectionStatusIndicator status={connectionStatus} />
          </div>
        </div>
      </header>

      {/* 🎯 Layout 100% responsivo - Mobile até TV 70" */}
      <main className="fixed inset-0 pt-12 sm:pt-14 md:pt-16 lg:pt-20 overflow-hidden">
        <div className="h-full w-full flex flex-col p-2 sm:p-3 md:p-4 lg:p-6 xl:p-8 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
          
          {/* 📺 Vídeo principal - 60% da altura */}
          <div className="flex-[60] min-h-0 w-full">
            <div className="h-full w-full bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-md rounded-lg sm:rounded-xl md:rounded-2xl shadow-2xl border border-white/5 overflow-hidden">
              {/* ✅ NUNCA parar: usar displayVideos que inclui cache offline */}
              {displayVideos.length > 0 ? (
                <CommercialVideoHero 
                  videos={displayVideos.map(v => ({
                    id: v.video_id || '',
                    video_url: v.video_url,
                    video_nome: v.video_name || ''
                  }))}
                  className="h-full w-full"
                  onPlayingChange={handlePlayingChange}
                  onPlaylistEnd={handlePlaylistEnd}
                  onVideosChange={handleVideosChange}
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-white">
                  <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mx-auto" />
                    <p className="text-xl">Aguardando primeiro carregamento...</p>
                  </div>
                </div>
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
