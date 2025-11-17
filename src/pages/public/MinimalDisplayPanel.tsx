import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useMinimalDisplayVideos } from '@/hooks/useMinimalDisplayVideos';
import { supabase } from '@/integrations/supabase/client';
import { WifiOff } from 'lucide-react';
import { UpdateIndicator } from '@/components/display/UpdateIndicator';

interface MinimalDisplayPanelProps {
  buildingId?: string;
}

/**
 * Player MINIMALISTA para displays públicos
 * - Sem hooks pesados
 * - Polling manual controlado (10min)
 * - Performance otimizada
 * - Sem requisições desnecessárias
 */
const MinimalDisplayPanel: React.FC<MinimalDisplayPanelProps> = ({ buildingId: propBuildingId }) => {
  const params = useParams<{ buildingId: string }>();
  const rawBuildingId = propBuildingId || params.buildingId || '';
  
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  // ✅ Validações simples
  if (rawBuildingId === ':buildingId' || rawBuildingId.startsWith(':')) {
    return <Navigate to="/404" replace />;
  }

  if (rawBuildingId && !UUID_REGEX.test(rawBuildingId)) {
    return <Navigate to="/404" replace />;
  }

  const buildingId = rawBuildingId;
  const { videos, loading, isUpdating, refresh } = useMinimalDisplayVideos(buildingId);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [buildingName, setBuildingName] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOffline, setShowOffline] = useState(false);
  const [playlistCycleCount, setPlaylistCycleCount] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const nextVideoRef = useRef<HTMLVideoElement>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const offlineTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ Buscar nome do prédio (UMA VEZ)
  useEffect(() => {
    if (!buildingId) return;

    const fetchBuildingName = async () => {
      try {
        const { data, error } = await supabase
          .from('buildings')
          .select('nome')
          .eq('id', buildingId)
          .single();

        if (data) setBuildingName(data.nome);
      } catch (err) {
        console.error('❌ [MINIMAL] Erro ao buscar nome do prédio:', err);
      }
    };

    fetchBuildingName();
  }, [buildingId]);

  // ✅ Monitorar conexão
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOffline(false);
      if (offlineTimeoutRef.current) {
        clearTimeout(offlineTimeoutRef.current);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      offlineTimeoutRef.current = setTimeout(() => {
        setShowOffline(true);
      }, 5000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (offlineTimeoutRef.current) {
        clearTimeout(offlineTimeoutRef.current);
      }
    };
  }, []);

  // ✅ Verificação inteligente de mudanças na playlist
  const checkForPlaylistChanges = useCallback(async () => {
    try {
      console.log('🔍 [MINIMAL] Verificando alterações na playlist...');
      
      // Simplesmente fazer refresh silencioso - o useEffect vai detectar mudanças
      await refresh(true);
      
      console.log('✅ [MINIMAL] Verificação concluída');
      
    } catch (err) {
      console.error('❌ [MINIMAL] Erro ao verificar mudanças:', err);
    }
  }, [refresh]);

  // ✅ Polling de SEGURANÇA (30 minutos - apenas fallback)
  useEffect(() => {
    console.log('🔄 [MINIMAL] Configurando polling de segurança (30min)');
    
    refreshIntervalRef.current = setInterval(() => {
      console.log('🔄 [MINIMAL] Refresh de segurança');
      refresh();
      setPlaylistCycleCount(0);
    }, 30 * 60 * 1000); // 30 minutos

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [refresh]);

  // ✅ Controle de reprodução com detecção de ciclos
  const handleVideoEnd = useCallback(() => {
    if (videos.length === 0) return;
    
    const nextIndex = (currentIndex + 1) % videos.length;
    
    // ✅ Detectar ciclo completo (voltou ao índice 0)
    if (nextIndex === 0) {
      const newCycleCount = playlistCycleCount + 1;
      setPlaylistCycleCount(newCycleCount);
      console.log('🔄 [MINIMAL] Ciclo completo:', newCycleCount);
      
      // 🔄 A cada 3 ciclos completos, verificar mudanças
      if (newCycleCount % 3 === 0) {
        console.log('🔄 [MINIMAL] Verificando mudanças após 3 ciclos');
        checkForPlaylistChanges();
      }
    }
    
    setCurrentIndex(nextIndex);
  }, [videos.length, currentIndex, playlistCycleCount, checkForPlaylistChanges]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.addEventListener('ended', handleVideoEnd);
    return () => video.removeEventListener('ended', handleVideoEnd);
  }, [handleVideoEnd]);

  // ✅ Detectar mudanças na playlist e resetar player
  const prevVideosRef = useRef<string>('');
  useEffect(() => {
    const currentVideoIds = videos.map(v => v.video_id).sort().join(',');
    const prevVideoIds = prevVideosRef.current;
    
    // Se os vídeos mudaram E não é a primeira carga
    if (currentVideoIds !== prevVideoIds && prevVideoIds !== '') {
      console.log('🔄 [MINIMAL] ✅ VÍDEOS MUDARAM - Atualizando player');
      console.log('   Antes:', prevVideoIds);
      console.log('   Depois:', currentVideoIds);
      
      // Resetar para o início da nova playlist
      setCurrentIndex(0);
      setPlaylistCycleCount(0);
      
      // Forçar replay do vídeo atual
      if (videoRef.current) {
        videoRef.current.load();
        videoRef.current.play().catch(err => {
          console.error('❌ [MINIMAL] Erro ao iniciar vídeo:', err);
        });
      }
    }
    
    prevVideosRef.current = currentVideoIds;
  }, [videos]);

  // ✅ Resetar índice quando vídeos mudarem (fallback)
  useEffect(() => {
    if (videos.length > 0 && currentIndex >= videos.length) {
      setCurrentIndex(0);
    }
  }, [videos, currentIndex]);

  // ✅ Reprodução automática
  useEffect(() => {
    const video = videoRef.current;
    if (!video || videos.length === 0) return;

    const playVideo = async () => {
      try {
        await video.play();
      } catch (err) {
        console.error('❌ [MINIMAL] Erro ao reproduzir:', err);
      }
    };

    playVideo();
  }, [currentIndex, videos]);

  // 🎬 Renderização
  if (loading && videos.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mx-auto" />
          <p className="text-white text-xl">Carregando...</p>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center space-y-4 px-4">
          <div className="text-6xl">📺</div>
          <h1 className="text-white text-2xl font-bold">Aguardando conteúdo</h1>
          <p className="text-gray-400">
            {buildingName || 'Display'} - Nenhum vídeo disponível no momento
          </p>
        </div>
      </div>
    );
  }

  const currentVideo = videos[currentIndex];

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Indicador de Atualização */}
      <UpdateIndicator isUpdating={isUpdating} videosCount={videos.length} />
      
      {/* Indicador de offline */}
      {showOffline && (
        <div className="absolute top-4 right-4 z-50 bg-red-500/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg">
          <WifiOff className="w-5 h-5" />
          <span className="font-medium">Sem conexão</span>
        </div>
      )}

      {/* Player de vídeo */}
      <video
        ref={videoRef}
        src={currentVideo.video_url}
        className="absolute inset-0 w-full h-full object-contain"
        playsInline
        autoPlay
        muted
        onError={() => {
          console.error('❌ [MINIMAL] Erro ao carregar vídeo:', currentVideo.video_id);
          handleVideoEnd();
        }}
      />

      {/* Vídeo oculto para pre-loading do próximo */}
      <video
        ref={nextVideoRef}
        preload="auto"
        className="hidden"
        src={videos.length > 0 ? videos[(currentIndex + 1) % videos.length]?.video_url : ''}
      />

      {/* Info (debug) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-2 rounded text-xs">
          Vídeo {currentIndex + 1}/{videos.length} • {buildingName}
        </div>
      )}
    </div>
  );
};

export default MinimalDisplayPanel;
