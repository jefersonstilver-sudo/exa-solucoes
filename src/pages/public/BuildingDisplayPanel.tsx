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

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/80 text-lg">Carregando programação...</p>
        </div>
      </div>
    );
  }

  // Sem vídeos
  if (activeVideos.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-light text-white mb-2">{buildingName}</h1>
          <p className="text-white/60 text-sm">Nenhum vídeo em exibição no momento</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Header minimalista com nome do prédio */}
      <div className="absolute top-0 left-0 right-0 z-10 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-light text-white tracking-wide">
            {buildingName}
          </h1>
        </div>
      </div>

      {/* Player centralizado */}
      <div className="flex-1 flex items-center justify-center p-8 pt-24">
        <div className="w-full max-w-6xl">
          {selectedVideo && (
            <div className="relative">
              {/* Video player */}
              <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl">
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
                
                {/* Overlay sutil com info do vídeo */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                  <div className="flex items-end justify-between">
                    <div className="flex-1">
                      <p className="text-white/90 text-sm font-light mb-1">
                        {selectedVideo.video_name}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-white/60">
                        <span>{selectedVideo.client_name}</span>
                        <span>•</span>
                        <span>{selectedVideoIndex + 1} / {activeVideos.length}</span>
                      </div>
                    </div>
                    
                    {selectedVideo.is_currently_active && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-full backdrop-blur-sm">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-xs font-light text-green-300">AO VIVO</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Indicador de progresso discreto */}
              <div className="mt-4 flex items-center justify-center gap-2">
                {activeVideos.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      index === selectedVideoIndex 
                        ? 'w-8 bg-white' 
                        : 'w-1 bg-white/30'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer com branding discreto */}
      <div className="p-6 text-center">
        <p className="text-white/40 text-xs font-light tracking-wider">
          DIGITAL SIGNAGE
        </p>
      </div>
    </div>
  );
};

export default BuildingDisplayPanel;
