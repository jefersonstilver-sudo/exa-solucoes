import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useBuildingActiveVideos } from '@/hooks/useBuildingActiveVideos';
import { supabase } from '@/integrations/supabase/client';
import exaLogo from '@/assets/exa-logo.png';
import WeatherFooter from '@/components/public/WeatherFooter';
import { Wifi, WifiOff } from 'lucide-react';
import { useNetworkMonitor } from '@/hooks/useNetworkMonitor';
import { CommercialDisplayLayout } from '@/components/commercial/CommercialDisplayLayout';
import { CommercialVideoHero } from '@/components/commercial/CommercialVideoHero';
import { BuildingNoticesCard } from '@/components/commercial/BuildingNoticesCard';
import { NewsWithQRPanel } from '@/components/commercial/NewsWithQRPanel';
import { BuildingPhotoDateCard } from '@/components/commercial/BuildingPhotoDateCard';
import { CurrencyTickerBar } from '@/components/commercial/CurrencyTickerBar';

interface BuildingDisplayCommercialProps {
  buildingId?: string;
}

const BuildingDisplayCommercial: React.FC<BuildingDisplayCommercialProps> = ({ buildingId: propBuildingId }) => {
  const params = useParams<{ buildingId: string }>();
  const buildingId = propBuildingId || params.buildingId || '';
  const { videos: activeVideos, loading, refetch } = useBuildingActiveVideos(buildingId);
  const [buildingName, setBuildingName] = useState('');
  const [buildingCode, setBuildingCode] = useState('');
  const networkStatus = useNetworkMonitor();
  const pollingIntervalRef = useRef<NodeJS.Timeout>();
  const lastVideoCountRef = useRef(0);

  // Buscar dados do prédio
  useEffect(() => {
    const fetchBuildingData = async () => {
      if (!buildingId) return;
      
      const { data, error } = await supabase
        .from('buildings')
        .select('nome, codigo')
        .eq('id', buildingId)
        .single();
      
      if (data && !error) {
        setBuildingName(data.nome);
        setBuildingCode(data.codigo);
      }
    };

    fetchBuildingData();
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
        <div className="container mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between">
          {/* Logo EXA */}
          <div className="flex items-center gap-2 md:gap-3">
            <div className="relative h-8 md:h-10 w-auto">
              <div className="absolute inset-0 blur-lg bg-red-500/30 rounded-full" />
              <img 
                src={exaLogo} 
                alt="EXA" 
                className="h-8 md:h-10 w-auto relative z-10 drop-shadow-2xl brightness-110"
              />
            </div>
          </div>

          {/* Nome do prédio - centralizado */}
          {buildingName && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <h1 className="text-white text-sm md:text-lg font-semibold tracking-wide drop-shadow-lg">
                {buildingName}
              </h1>
            </div>
          )}

          {/* Status de conexão em tempo real */}
          <div className="flex items-center gap-2">
            {networkStatus.isOnline ? (
              <div className="flex items-center gap-1.5 px-2 md:px-3 py-1 md:py-1.5 bg-green-500/20 rounded-full border border-green-500/30">
                <Wifi className="h-3 md:h-3.5 w-3 md:w-3.5 text-green-400 animate-pulse" />
                <span className="hidden md:inline text-green-400 text-xs font-medium">
                  Conectado {networkStatus.downlink > 0 && `• ${networkStatus.downlink} Mbps`}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2 md:px-3 py-1 md:py-1.5 bg-red-500/20 rounded-full border border-red-500/30 animate-pulse">
                <WifiOff className="h-3 md:h-3.5 w-3 md:w-3.5 text-red-400" />
                <span className="hidden md:inline text-red-400 text-xs font-medium">Offline</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Conteúdo principal - Layout Mobile-First */}
      <main className="pt-14 md:pt-16 px-2 md:px-6 pb-4 md:pb-6">
        <CommercialDisplayLayout
          video={
            <CommercialVideoHero 
              videos={activeVideos.map(v => ({
                id: v.id || '',
                video_url: v.video_url,
                video_nome: v.video_nome || ''
              }))}
            />
          }
          notices={
            <BuildingNoticesCard buildingId={buildingId} />
          }
          news={
            <NewsWithQRPanel 
              buildingId={buildingId}
              buildingName={buildingName}
              buildingCode={buildingCode}
            />
          }
          photo={
            <BuildingPhotoDateCard buildingId={buildingId} />
          }
          ticker={
            <CurrencyTickerBar />
          }
          weather={
            <WeatherFooter buildingName={buildingName} />
          }
        />
      </main>
    </div>
  );
};

export default BuildingDisplayCommercial;
