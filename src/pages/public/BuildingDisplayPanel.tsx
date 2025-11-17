import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useBuildingActiveVideos } from '@/hooks/useBuildingActiveVideos';
import { supabase } from '@/integrations/supabase/client';
import { useNetworkMonitor } from '@/hooks/useNetworkMonitor';
import { useVideoProtection } from '@/hooks/useVideoProtection';
import { useVideoCache } from '@/hooks/useVideoCache';
import { WifiOff } from 'lucide-react';
import { VideoDebugger } from '@/utils/videoDebugger';
import { useBuildingScheduleMonitor } from '@/hooks/useBuildingScheduleMonitor';
import { UpdateIndicator } from '@/components/display/UpdateIndicator';

interface BuildingDisplayPanelProps {
  buildingId?: string;
}

const BuildingDisplayPanel: React.FC<BuildingDisplayPanelProps> = ({ buildingId: propBuildingId }) => {
  const params = useParams<{ buildingId: string }>();
  const rawBuildingId = propBuildingId || params.buildingId || '';
  const isPlayingRef = useRef(false);
  const isCheckingRef = useRef(false);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  VideoDebugger.logEvent('ROUTING', 'Debug de rota (Panel)', {
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
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [buildingName, setBuildingName] = useState('');
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>('');
  const [videoError, setVideoError] = useState(false);
  const [showOfflineIndicator, setShowOfflineIndicator] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const nextVideoRef = useRef<HTMLVideoElement>(null);
  
  // ✅ SEMPRE chamar hooks (não condicionalmente)
  const hasVideos = activeVideos.length > 0;
  const networkStatus = useNetworkMonitor();
  const { getCachedVideoUrl, preCacheVideos } = useVideoCache(buildingId, { enabled: hasVideos });
  
  // ✅ Ref estável para refetch
  const refetchRef = useRef(refetch);
  
  useEffect(() => {
    refetchRef.current = refetch;
  }, [refetch]);
  
  // ✅ SEMPRE chamar hooks (não condicionalmente)
  const { containerRef: protectionRef } = useVideoProtection({
    preventDownload: true,
    preventPrint: true,
    preventDevTools: true,
    preventScreenCapture: true,
    enabled: hasVideos
  });

  VideoDebugger.logEvent('DISPLAY', 'Vídeos recebidos (Panel)', {
    count: activeVideos.length,
    videoIds: activeVideos.map(v => v.video_id).join(',')
  });
  
  // ✅ SISTEMA DE HEARTBEAT PARA PAINEL
  useEffect(() => {
    // Buscar painelId do localStorage
    const painelId = localStorage.getItem('painel_id');
    if (!painelId || !buildingId) return;

    console.log('🔵 [HEARTBEAT] Iniciando sistema de heartbeat para painel:', painelId);

    // Função para enviar heartbeat
    const enviarHeartbeat = async () => {
      try {
        await supabase.functions.invoke('painel-heartbeat', {
          body: {
            painel_id: painelId,
            url_atual: window.location.href,
            device_info: {
              userAgent: navigator.userAgent,
              screen: {
                width: window.screen.width,
                height: window.screen.height
              },
              language: navigator.language,
              playing: isPlayingRef.current
            }
          }
        });
        console.log('✅ [HEARTBEAT] Heartbeat enviado com sucesso');
      } catch (error) {
        console.error('❌ [HEARTBEAT] Erro ao enviar heartbeat:', error);
      }
    };

    // Enviar heartbeat imediatamente
    enviarHeartbeat();

    // Enviar heartbeat a cada 5 minutos
    heartbeatIntervalRef.current = setInterval(enviarHeartbeat, 300000);

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        console.log('🔴 [HEARTBEAT] Sistema de heartbeat encerrado');
      }
    };
  }, [buildingId]);
  
  // Callbacks estáveis para evitar re-renders infinitos
  const handlePlayingChange = useCallback((playing: boolean) => {
    isPlayingRef.current = playing;
  }, []);

  const handlePlaylistEnd = useCallback(() => {
    isPlayingRef.current = false;
  }, []);

  // Preload próximo vídeo
  const nextVideoIndex = (selectedVideoIndex + 1) % activeVideos.length;
  const nextVideo = activeVideos[nextVideoIndex];

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
  
  // ✅ OTIMIZAÇÃO CRÍTICA: Só monitorar agendamentos se há vídeos
  useBuildingScheduleMonitor({
    buildingId,
    onScheduleChange: () => {
      VideoDebugger.logEvent('SCHEDULE', 'Mudança de agendamento detectada (Panel) - forçando atualização');
      refetchRef.current();
    },
    intervalMinutes: 1,
    enabled: hasVideos
  });

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

  // ✅ Sistema de polling com refetch estável via ref (3 minutos) - SÓ SE HÁ VÍDEOS
  useEffect(() => {
    if (!buildingId || !hasVideos) return;

    VideoDebugger.logEvent('POLLING', 'Sistema iniciado (Panel - 3 minutos)');

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

        VideoDebugger.logEvent('POLLING', 'Verificando atualizações (Panel)', {
          currentCount: activeVideos.length,
          currentIds: currentVideoIds
        });

        await refetchRef.current(); // ✅ Usar ref estável
        
        VideoDebugger.logEvent('POLLING', 'Verificação concluída (Panel)');
      } catch (error) {
        VideoDebugger.logEvent('POLLING', 'Erro ao verificar (Panel)', { 
          error: error instanceof Error ? error.message : 'Erro desconhecido' 
        });
      } finally {
        isCheckingRef.current = false;
      }
    };

    const interval = setInterval(checkForUpdates, 180000); // 3 minutos

    return () => {
      VideoDebugger.logEvent('POLLING', 'Sistema encerrado (Panel)');
      clearInterval(interval);
    };
  }, [buildingId]); // ✅ Apenas buildingId como dependência

  // Pre-cachear vídeos
  useEffect(() => {
    if (activeVideos.length > 0) {
      console.log('[DISPLAY PANEL] Pre-caching videos...');
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
        console.log('[DISPLAY PANEL] Video carregado:', selectedVideo.video_name);
      } catch (error) {
        console.error('[DISPLAY PANEL] Erro ao carregar video:', error);
        setVideoError(true);
      }
    };

    loadVideo();
  }, [selectedVideoIndex, activeVideos, getCachedVideoUrl]);

  // Mostrar indicador offline por 5 segundos quando perder conexao
  useEffect(() => {
    if (!networkStatus.isOnline) {
      setShowOfflineIndicator(true);
      const timer = setTimeout(() => setShowOfflineIndicator(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [networkStatus.isOnline]);

  // ✅ Auto-avancar com loop infinito GARANTIDO e error handling
  useEffect(() => {
    const video = videoRef.current;
    if (!video || activeVideos.length === 0) return;

    const handleVideoEnd = () => {
      console.log('[DISPLAY PANEL] 🔄 Vídeo terminou - avançando para próximo');
      handlePlaylistEnd();
      const nextIndex = (selectedVideoIndex + 1) % activeVideos.length;
      console.log(`[DISPLAY PANEL] ⏭️ Próximo vídeo: ${nextIndex + 1}/${activeVideos.length}`);
      setSelectedVideoIndex(nextIndex);
    };

    const handleCanPlay = () => {
      console.log('[DISPLAY PANEL] ▶️ Vídeo pronto - iniciando reprodução');
      handlePlayingChange(true);
      video.play().catch(err => {
        console.error('[DISPLAY PANEL] ❌ Autoplay bloqueado:', err);
        // Tentar novamente após 1s
        setTimeout(() => {
          video.play().catch(() => console.error('[DISPLAY PANEL] Autoplay falhou novamente'));
        }, 1000);
      });
    };

    const handleError = () => {
      console.error('[DISPLAY PANEL] ❌ Erro ao reproduzir vídeo - pulando imediatamente');
      setVideoError(true);
      const nextIndex = (selectedVideoIndex + 1) % activeVideos.length;
      console.log(`[DISPLAY PANEL] ⏭️ Pulando para: ${nextIndex + 1}/${activeVideos.length}`);
      setSelectedVideoIndex(nextIndex);
    };

    const handlePause = () => {
      // ✅ CRÍTICO: Se o vídeo pausar sozinho, retomar reprodução
      console.warn('[DISPLAY PANEL] ⚠️ Vídeo pausado inesperadamente - retomando');
      if (!video.ended) {
        video.play().catch(err => console.error('[DISPLAY PANEL] Erro ao retomar:', err));
      }
    };

    const handleStalled = () => {
      console.warn('[DISPLAY PANEL] ⚠️ Reprodução travada - tentando retomar');
      video.load();
      video.play().catch(err => console.error('[DISPLAY PANEL] Erro ao retomar após stall:', err));
    };

    video.addEventListener('ended', handleVideoEnd);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);
    video.addEventListener('pause', handlePause);
    video.addEventListener('stalled', handleStalled);
    
    return () => {
      video.removeEventListener('ended', handleVideoEnd);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('stalled', handleStalled);
    };
  }, [selectedVideoIndex, activeVideos.length, handlePlayingChange, handlePlaylistEnd]);

  const selectedVideo = activeVideos[selectedVideoIndex];

  // Loading - sem mostrar para evitar lag visual
  if (loading && activeVideos.length === 0) {
    return (
      <div className="min-h-screen bg-black" />
    );
  }

  // Sem vídeos - tela preta com mensagem discreta
  if (activeVideos.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-gray-400 max-w-md px-4">
          <div className="text-6xl mb-4">📺</div>
          <p className="text-lg font-medium mb-2">{buildingName || 'Display Painel'}</p>
          <p className="text-sm opacity-75">
            Nenhum conteúdo disponível no momento.
          </p>
          <p className="text-xs opacity-50 mt-4">
            Aguardando configuração de vídeos...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={protectionRef} className="w-full h-screen bg-black overflow-hidden select-none">
      {/* Indicador de Atualização */}
      <UpdateIndicator isUpdating={isUpdating} videosCount={activeVideos.length} />
      
      {/* Indicador Offline Discreto */}
      {showOfflineIndicator && !networkStatus.isOnline && (
        <div className="fixed top-4 right-4 z-50 bg-red-500/90 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <WifiOff className="h-4 w-4" />
          <span className="text-sm font-medium">Modo Offline - Reproduzindo do cache</span>
        </div>
      )}

      {/* Player fullscreen limpo com CACHE OFFLINE */}
      <div className="w-full h-full relative" onContextMenu={(e) => e.preventDefault()}>
        {selectedVideo && currentVideoUrl && !videoError && (
          <>
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
          </>
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
