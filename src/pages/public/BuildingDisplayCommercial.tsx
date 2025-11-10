import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useBuildingActiveVideos } from '@/hooks/useBuildingActiveVideos';
import { supabase } from '@/integrations/supabase/client';

const BuildingDisplayCommercial = () => {
  const { buildingId } = useParams<{ buildingId: string }>();
  const { videos: activeVideos, loading } = useBuildingActiveVideos(buildingId || '');
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [buildingName, setBuildingName] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

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

  // Auto-avançar com transição suave
  useEffect(() => {
    const video = videoRef.current;
    if (!video || activeVideos.length === 0) return;

    const handleVideoEnd = () => {
      setIsTransitioning(true);
      setTimeout(() => {
        const nextIndex = (selectedVideoIndex + 1) % activeVideos.length;
        setSelectedVideoIndex(nextIndex);
        setIsTransitioning(false);
      }, 300);
    };

    video.addEventListener('ended', handleVideoEnd);
    return () => video.removeEventListener('ended', handleVideoEnd);
  }, [selectedVideoIndex, activeVideos.length]);

  const selectedVideo = activeVideos[selectedVideoIndex];

  // Loading - elegante
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  // Sem vídeos
  if (activeVideos.length === 0) {
    return <div className="min-h-screen bg-black" />;
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Moldura do painel - simula hardware físico */}
      <div className="absolute inset-0">
        {/* Borda superior - simula moldura do painel */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-zinc-900 to-transparent z-10" />
        
        {/* Borda inferior - simula moldura do painel */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-zinc-900 to-transparent z-10" />
        
        {/* Bordas laterais */}
        <div className="absolute top-0 left-0 bottom-0 w-8 bg-gradient-to-r from-zinc-900 to-transparent z-10" />
        <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-zinc-900 to-transparent z-10" />
      </div>

      {/* Logo EXA - posicionamento profissional */}
      <div className="absolute bottom-8 right-8 z-20">
        <div className="backdrop-blur-sm bg-black/30 px-6 py-3 rounded-lg border border-white/10">
          <svg viewBox="0 0 120 40" className="h-8 w-auto">
            <text x="10" y="28" fill="white" fontSize="28" fontWeight="700" fontFamily="'Inter', sans-serif" letterSpacing="2">
              EXA
            </text>
            <text x="10" y="36" fill="white" fontSize="7" fontWeight="300" fontFamily="'Inter', sans-serif" letterSpacing="3" opacity="0.6">
              MÍDIA
            </text>
          </svg>
        </div>
      </div>

      {/* Vídeo player - sem controles, transição suave */}
      <div className="min-h-screen flex items-center justify-center">
        {selectedVideo && (
          <div className={`w-full h-screen transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
            <video
              ref={videoRef}
              key={selectedVideo.video_url}
              src={selectedVideo.video_url}
              className="w-full h-full object-cover"
              autoPlay
              muted
              playsInline
              style={{ pointerEvents: 'none' }}
            >
              Seu navegador não suporta vídeo.
            </video>
          </div>
        )}
      </div>

      {/* Reflexo sutil na tela - simula vidro do painel */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none z-10" />
    </div>
  );
};

export default BuildingDisplayCommercial;
