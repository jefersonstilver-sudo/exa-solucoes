import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useBuildingActiveVideos } from '@/hooks/useBuildingActiveVideos';
import { useBuildingScheduleMonitor } from '@/hooks/useBuildingScheduleMonitor';
import { usePendingPlaylistUpdates } from '@/hooks/usePendingPlaylistUpdates';
import { usePlaybackLogger } from '@/hooks/usePlaybackLogger';
import { supabase } from '@/integrations/supabase/client';
import { WifiOff } from 'lucide-react';
import { UpdateIndicator } from '@/components/display/UpdateIndicator';

interface MinimalDisplayPanelProps {
  buildingId?: string;
}

interface MinimalVideo {
  video_id: string;
  video_url: string;
  video_duracao: number | null;
  slot_position: number;
}

/**
 * 🎯 Player MINIMALISTA - JAMAIS para ou interrompe vídeos
 * Todas as atualizações aguardam o fim do ciclo completo da playlist
 */
const MinimalDisplayPanel: React.FC<MinimalDisplayPanelProps> = ({ buildingId: propBuildingId }) => {
  const params = useParams<{ buildingId: string }>();
  const rawBuildingId = propBuildingId || params.buildingId || '';
  
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (rawBuildingId === ':buildingId' || rawBuildingId.startsWith(':')) {
    return <Navigate to="/404" replace />;
  }

  if (rawBuildingId && !UUID_REGEX.test(rawBuildingId)) {
    return <Navigate to="/404" replace />;
  }

  const buildingId = rawBuildingId;
  
  const { videos: activeVideos, loading, isUpdating, refetch } = useBuildingActiveVideos(buildingId);
  const { onVideoStart, onVideoEnd } = usePlaybackLogger(buildingId);
  
  // 📦 Sistema de pending updates
  const {
    hasPendingUpdates,
    setPendingUpdate,
    applyPendingUpdates,
    updateCurrentHash,
    pendingVideosCount
  } = usePendingPlaylistUpdates<MinimalVideo>({
    getPlaylistHash: (videos) => videos.map(v => v.video_id).sort().join(',')
  });
  
  const refetchRef = useRef(refetch);
  useEffect(() => {
    refetchRef.current = refetch;
  }, [refetch]);
  
  const [cachedVideos, setCachedVideos] = useState<MinimalVideo[]>([]);
  const [currentPlaylist, setCurrentPlaylist] = useState<MinimalVideo[]>([]);
  
  const formattedActiveVideos = useMemo(() => 
    activeVideos.map(v => ({
      video_id: v.video_id,
      video_url: v.video_url,
      video_duracao: v.video_duracao,
      slot_position: 0
    })),
    [activeVideos]
  );
  
  useEffect(() => {
    if (formattedActiveVideos.length > 0) {
      setCachedVideos(formattedActiveVideos);
    }
  }, [formattedActiveVideos]);
  
  useEffect(() => {
    if (formattedActiveVideos.length > 0 && currentPlaylist.length === 0) {
      setCurrentPlaylist(formattedActiveVideos);
      updateCurrentHash(formattedActiveVideos);
    }
  }, [formattedActiveVideos, currentPlaylist.length, updateCurrentHash]);
  
  useEffect(() => {
    if (formattedActiveVideos.length > 0 && currentPlaylist.length > 0) {
      const currentHash = currentPlaylist.map(v => v.video_id).sort().join(',');
      const newHash = formattedActiveVideos.map(v => v.video_id).sort().join(',');
      
      if (currentHash !== newHash) {
        setPendingUpdate(formattedActiveVideos);
      }
    }
  }, [formattedActiveVideos, currentPlaylist, setPendingUpdate]);
  
  const videos = useMemo(() => {
    if (currentPlaylist.length > 0) return currentPlaylist;
    if (formattedActiveVideos.length > 0) return formattedActiveVideos;
    if (cachedVideos.length > 0) return cachedVideos;
    return [];
  }, [currentPlaylist, formattedActiveVideos, cachedVideos]);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [buildingName, setBuildingName] = useState('');
  const [showOffline, setShowOffline] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  
  useBuildingScheduleMonitor({
    buildingId,
    onScheduleChange: () => refetchRef.current(),
    intervalMinutes: 1,
    enabled: true
  });

  useEffect(() => {
    if (!buildingId) return;
    const fetchBuildingName = async () => {
      const { data } = await supabase
        .from('buildings')
        .select('nome')
        .eq('id', buildingId)
        .single();
      if (data) setBuildingName(data.nome);
    };
    fetchBuildingName();
  }, [buildingId]);

  useEffect(() => {
    const handleOffline = () => setShowOffline(true);
    const handleOnline = () => setShowOffline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleVideoEnd = useCallback(() => {
    // Log playback completion
    onVideoEnd();
    
    const nextIndex = (currentIndex + 1) % videos.length;
    
    if (nextIndex === 0 && hasPendingUpdates) {
      const newPlaylist = applyPendingUpdates();
      if (newPlaylist && newPlaylist.length > 0) {
        setCurrentPlaylist(newPlaylist.map(v => ({
          video_id: v.video_id,
          video_url: v.video_url,
          video_duracao: v.video_duracao,
          slot_position: 0
        })));
        setCurrentIndex(0);
        return;
      }
    }
    
    setCurrentIndex(nextIndex);
  }, [currentIndex, videos.length, hasPendingUpdates, applyPendingUpdates]);

  if (loading && videos.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-2">{buildingName}</h2>
          <p className="text-gray-400">Aguardando conteúdo...</p>
        </div>
      </div>
    );
  }

  const currentVideo = videos[currentIndex];

  return (
    <div className="relative min-h-screen bg-black">
      {hasPendingUpdates && (
        <div className="fixed top-4 right-4 z-50 bg-yellow-500/90 text-black px-4 py-2 rounded-lg">
          {pendingVideosCount} vídeo(s) aguardando fim do ciclo
        </div>
      )}
      
      <UpdateIndicator isUpdating={isUpdating} videosCount={activeVideos.length} />
      
      {showOffline && (
        <div className="fixed top-4 left-4 z-50 bg-red-500/90 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <WifiOff className="h-4 w-4" />
          Offline - Usando cache
        </div>
      )}
      
      <video
        ref={videoRef}
        key={`${currentVideo.video_id}-${currentIndex}`}
        src={currentVideo.video_url}
        className="w-full h-screen object-cover"
        autoPlay
        muted
        playsInline
        onEnded={handleVideoEnd}
        onError={handleVideoEnd}
      />
      
      <div className="fixed bottom-4 right-4 z-50 bg-black/50 text-white px-3 py-2 rounded text-xs">
        Vídeo {currentIndex + 1}/{videos.length}
        {hasPendingUpdates && <> | ⏳ {pendingVideosCount} pending</>}
      </div>
    </div>
  );
};

export default MinimalDisplayPanel;
