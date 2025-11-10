import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useBuildingActiveVideos } from '@/hooks/useBuildingActiveVideos';
import { supabase } from '@/integrations/supabase/client';
import { Play, Pause } from 'lucide-react';

const BuildingDisplayCommercial = () => {
  const { buildingId } = useParams<{ buildingId: string }>();
  const { videos: activeVideos, loading } = useBuildingActiveVideos(buildingId || '');
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [buildingName, setBuildingName] = useState('');
  const [isPaused, setIsPaused] = useState(false);
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

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPaused(false);
    } else {
      video.pause();
      setIsPaused(true);
    }
  };

  // Loading - limpo e elegante
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 border-4 border-white/10 border-t-white rounded-full animate-spin mx-auto" />
          <p className="text-white/60 text-sm font-light tracking-wider">Carregando conteúdo</p>
        </div>
      </div>
    );
  }

  // Sem vídeos - elegante
  if (activeVideos.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md px-6">
          <div className="w-24 h-24 mx-auto bg-white/5 rounded-full flex items-center justify-center backdrop-blur-sm">
            <svg className="w-12 h-12 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-light text-white tracking-wide">{buildingName}</h2>
            <p className="text-white/50 text-sm font-light">Aguardando programação</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Background ambient effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.03),transparent_70%)] pointer-events-none" />
      
      {/* Header minimalista flutuante */}
      <div className="absolute top-0 left-0 right-0 z-20 p-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="backdrop-blur-md bg-white/5 px-6 py-3 rounded-full border border-white/10">
            <h1 className="text-xl font-light text-white tracking-wide">{buildingName}</h1>
          </div>
          
          {activeVideos.length > 1 && (
            <div className="backdrop-blur-md bg-white/5 px-4 py-2 rounded-full border border-white/10">
              <span className="text-sm font-light text-white/80">
                {selectedVideoIndex + 1} / {activeVideos.length}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Player centralizado com controles minimalistas */}
      <div className="flex items-center justify-center min-h-screen px-8 py-24">
        <div className="w-full max-w-7xl">
          {selectedVideo && (
            <div className="relative group">
              {/* Container do vídeo com bordas sutis */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-black/50 ring-1 ring-white/10">
                <video
                  ref={videoRef}
                  key={selectedVideo.video_url}
                  src={selectedVideo.video_url}
                  className="w-full h-auto"
                  autoPlay
                  muted
                  playsInline
                >
                  Seu navegador não suporta vídeo.
                </video>
                
                {/* Controle de play/pause ao clicar */}
                <button
                  onClick={handlePlayPause}
                  className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/0 hover:bg-black/20 transition-all group/play cursor-pointer"
                >
                  <div className={`transform transition-all duration-300 ${isPaused ? 'opacity-100 scale-100' : 'opacity-0 scale-75 group-hover/play:opacity-50'}`}>
                    {isPaused ? (
                      <Play className="w-20 h-20 text-white drop-shadow-2xl" fill="white" />
                    ) : (
                      <Pause className="w-20 h-20 text-white drop-shadow-2xl" fill="white" />
                    )}
                  </div>
                </button>

                {/* Info overlay - aparece apenas no hover */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="flex items-end justify-between">
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium text-white">{selectedVideo.video_name}</h3>
                      <p className="text-sm text-white/70 font-light">{selectedVideo.client_name}</p>
                    </div>
                    
                    {selectedVideo.is_currently_active && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-400/30 rounded-full backdrop-blur-sm">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-xs font-medium text-green-300 tracking-wider">AO VIVO</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress indicator modernizado - apenas se houver múltiplos vídeos */}
              {activeVideos.length > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2">
                  {activeVideos.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedVideoIndex(index)}
                      className={`transition-all duration-300 rounded-full cursor-pointer hover:scale-110 ${
                        index === selectedVideoIndex 
                          ? 'w-12 h-1.5 bg-white' 
                          : 'w-1.5 h-1.5 bg-white/30 hover:bg-white/50'
                      }`}
                      aria-label={`Ir para vídeo ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer discreto */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="text-center">
          <p className="text-white/30 text-xs font-light tracking-[0.3em] uppercase">
            Digital Signage
          </p>
        </div>
      </div>
    </div>
  );
};

export default BuildingDisplayCommercial;
