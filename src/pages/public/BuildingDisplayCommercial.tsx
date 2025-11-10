import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useBuildingActiveVideos } from '@/hooks/useBuildingActiveVideos';
import { supabase } from '@/integrations/supabase/client';
import exaLogo from '@/assets/exa-logo.png';
import WeatherFooter from '@/components/public/WeatherFooter';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header fixo premium com logo EXA */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-red-900 via-red-700 to-black shadow-2xl">
        <div className="container mx-auto px-8 h-20 flex items-center justify-between">
          {/* Logo EXA real */}
          <div className="flex items-center gap-4">
            <div className="relative h-12 w-auto">
              {/* Glow background */}
              <div className="absolute inset-0 blur-xl bg-red-500/40 rounded-full scale-150" />
              
              {/* Logo real da EXA */}
              <img 
                src={exaLogo} 
                alt="EXA" 
                className="h-12 w-auto relative z-10 drop-shadow-2xl brightness-110"
              />
            </div>
          </div>

          {/* Nome do prédio - centralizado */}
          {buildingName && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <h1 className="text-white text-xl font-semibold tracking-wide drop-shadow-lg">
                {buildingName}
              </h1>
            </div>
          )}
        </div>
      </header>

      {/* Conteúdo principal com painel centralizado */}
      <main className="min-h-screen pt-20 pb-24 flex items-center justify-center p-8">
        <div className="w-full max-w-6xl">
          {/* Container do painel - simula monitor/TV físico */}
          <div className="relative">
            {/* Moldura externa - simula bezel de monitor */}
            <div className="absolute -inset-8 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black rounded-3xl shadow-2xl" />
            
            {/* Moldura interna - profundidade */}
            <div className="absolute -inset-4 bg-gradient-to-br from-zinc-900 to-black rounded-2xl shadow-inner" />
            
            {/* Tela do painel */}
            <div className="relative bg-black rounded-xl overflow-hidden shadow-2xl" style={{ aspectRatio: '16/9' }}>
              {/* Brilho da tela */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none z-20" />
              
              {/* Vídeo */}
              {selectedVideo && (
                <div className={`w-full h-full transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
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
              
              {/* Reflexo sutil simulando vidro */}
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/[0.01] to-transparent pointer-events-none z-10" />
            </div>

            {/* Suporte/base do monitor (detalhe visual) */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-32 h-6 bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-t-lg shadow-lg" />
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-48 h-3 bg-gradient-to-b from-zinc-900 to-black rounded-full shadow-xl" />
          </div>
        </div>
      </main>

      {/* Footer com meteorologia e horário */}
      <WeatherFooter buildingName={buildingName} />
    </div>
  );
};

export default BuildingDisplayCommercial;
