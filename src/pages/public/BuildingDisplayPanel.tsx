import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useBuildingActiveVideos } from '@/hooks/useBuildingActiveVideos';
import { supabase } from '@/integrations/supabase/client';

const BuildingDisplayPanel = () => {
  const { buildingId } = useParams<{ buildingId: string }>();
  const { videos: activeVideos, loading } = useBuildingActiveVideos(buildingId || '');
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [buildingName, setBuildingName] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);

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

  // Auto-avançar para o próximo vídeo quando o atual terminar
  useEffect(() => {
    const video = videoRef.current;
    if (!video || activeVideos.length === 0) return;

    const handleVideoEnd = () => {
      const nextIndex = (selectedVideoIndex + 1) % activeVideos.length;
      setSelectedVideoIndex(nextIndex);
    };

    video.addEventListener('ended', handleVideoEnd);
    return () => video.removeEventListener('ended', handleVideoEnd);
  }, [selectedVideoIndex, activeVideos.length]);

  const selectedVideo = activeVideos[selectedVideoIndex];

  // Loading - limpo e minimalista
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
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
            className="w-full h-full object-contain"
            autoPlay
            muted
            playsInline
          >
            Seu navegador não suporta vídeo.
          </video>
        )}
      </div>
    </div>
  );
};

export default BuildingDisplayPanel;
