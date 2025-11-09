
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Video, Play, User, DollarSign, TvMinimal, Sparkles, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useBuildingActiveVideos } from '@/hooks/useBuildingActiveVideos';
import { VideoScheduleTooltip } from '../VideoScheduleTooltip';
import ModernSkeleton from '@/components/ui/ModernSkeleton';

interface BuildingActiveCampaignsTabProps {
  buildingId: string;
  buildingName: string;
}

const BuildingActiveCampaignsTab: React.FC<BuildingActiveCampaignsTabProps> = ({
  buildingId,
  buildingName
}) => {
  const { videos: activeVideos, loading, refetch } = useBuildingActiveVideos(buildingId);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  // Estatísticas dos vídeos
  const stats = useMemo(() => {
    const total = activeVideos.length;
    const activeNow = activeVideos.filter(v => v.is_currently_active).length;
    const totalCampaigns = new Set(activeVideos.map(v => v.pedido_id)).size;
    
    return { total, activeNow, totalCampaigns };
  }, [activeVideos]);

  const selectedVideo = activeVideos[selectedVideoIndex];

  // Auto-avançar para o próximo vídeo quando o atual terminar
  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleVideoEnd = () => {
      const nextIndex = (selectedVideoIndex + 1) % activeVideos.length;
      setSelectedVideoIndex(nextIndex);
    };

    video.addEventListener('ended', handleVideoEnd);
    return () => video.removeEventListener('ended', handleVideoEnd);
  }, [selectedVideoIndex, activeVideos.length]);

  // Loading
  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8">
            <ModernSkeleton variant="card" className="h-96" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Sem vídeos
  if (activeVideos.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-16">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-6 bg-gray-50 rounded-full">
                <TvMinimal className="h-12 w-12 text-gray-400" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-700">Nenhum Vídeo em Exibição</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Este prédio não possui vídeos ativos no momento
            </p>
            <Button onClick={refetch} variant="outline" size="sm" className="mt-4">
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header minimalista */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-slate-50 to-gray-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-900 rounded">
                <TvMinimal className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Programação Atual</h3>
                <p className="text-sm text-slate-600">{buildingName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-slate-500">No AR Agora</p>
                <p className="text-lg font-bold text-slate-900">{stats.activeNow}</p>
              </div>
              <div className="h-8 w-px bg-slate-200" />
              <div className="text-right">
                <p className="text-xs text-slate-500">Total de Vídeos</p>
                <p className="text-lg font-bold text-slate-900">{stats.total}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Player principal - Design corporativo */}
      {selectedVideo && (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-0">
            {/* Video player */}
            <div className="relative bg-black aspect-video">
              <video
                ref={videoRef}
                key={selectedVideo.video_url}
                src={selectedVideo.video_url}
                className="w-full h-full"
                autoPlay
                muted
                playsInline
              >
                Seu navegador não suporta vídeo.
              </video>
              
              {/* Overlay com informações minimalistas */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                <div className="flex items-end justify-between">
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium mb-1">{selectedVideo.video_name}</p>
                    <div className="flex items-center gap-3 text-xs text-white/80">
                      <span>{selectedVideo.client_name}</span>
                      <span>•</span>
                      <span>{selectedVideo.video_duracao}s</span>
                      <span>•</span>
                      <span>Vídeo {selectedVideoIndex + 1}/{stats.total}</span>
                    </div>
                  </div>
                  
                  {selectedVideo.is_currently_active && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-full backdrop-blur-sm">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-xs font-medium text-green-300">AO VIVO</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Barra de progresso da playlist */}
            <div className="p-4 bg-slate-50 border-t">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-slate-900 transition-all duration-300"
                    style={{ width: `${((selectedVideoIndex + 1) / stats.total) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-slate-600 whitespace-nowrap">
                  {selectedVideoIndex + 1} / {stats.total}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BuildingActiveCampaignsTab;
