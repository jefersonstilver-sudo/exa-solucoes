import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useBuildingActiveVideos } from '@/hooks/useBuildingActiveVideos';
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
  const networkStatus = useNetworkMonitor();
  const pollingIntervalRef = useRef<NodeJS.Timeout>();
  const lastVideoCountRef = useRef(0);
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

  // Atualizar contagem de vídeos
  useEffect(() => {
    lastVideoCountRef.current = activeVideos.length;
  }, [activeVideos.length]);

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
      {/* Header elegante */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-red-900/95 via-red-800/95 to-red-900/95 backdrop-blur-md shadow-2xl border-b border-white/10">
        <div className="container mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
          {/* Logo EXA */}
          <div className="flex items-center gap-3">
            <div className="relative h-10 md:h-12 w-auto">
              <div className="absolute inset-0 blur-xl bg-red-500/40 rounded-full animate-pulse" />
              <img 
                src={exaLogo} 
                alt="EXA Mídia" 
                className="h-10 md:h-12 w-auto relative z-10 drop-shadow-2xl brightness-110"
              />
            </div>
          </div>

          {/* Nome do prédio */}
          {buildingName && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <h1 className="text-white text-lg md:text-2xl font-bold tracking-wide drop-shadow-2xl">
                {buildingName}
              </h1>
            </div>
          )}

          {/* Status de conexão */}
          <div className="flex items-center gap-2">
            {networkStatus.isOnline ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 rounded-full border border-green-500/30">
                <Wifi className="h-4 w-4 text-green-400" />
                <span className="hidden md:inline text-green-400 text-xs font-medium">Online</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 rounded-full border border-red-500/30 animate-pulse">
                <WifiOff className="h-4 w-4 text-red-400" />
                <span className="hidden md:inline text-red-400 text-xs font-medium">Offline</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="pt-16 md:pt-20 pb-2">
        <div className="container mx-auto max-w-[1920px] space-y-2">
          {/* Painel do vídeo - Maior, no desktop menor e à esquerda */}
          <div className="px-2 md:px-4">
            <div className="md:max-w-[70%] bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/10 p-2">
              <CommercialVideoHero 
                videos={activeVideos.map(v => ({
                  id: v.video_id || '',
                  video_url: v.video_url,
                  video_nome: v.video_name || ''
                }))}
                className="rounded-xl overflow-hidden"
              />
            </div>
          </div>

          {/* Relógio e data ao vivo */}
          <div className="px-2 md:px-4">
            <LiveClock />
          </div>

          {/* Previsão do tempo */}
          <div className="px-2 md:px-4">
            <WeatherFooter buildingName={buildingName} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default BuildingDisplayCommercial;
