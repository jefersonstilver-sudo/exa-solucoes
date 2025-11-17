import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Pause, Clock, User, DollarSign, Video, ExternalLink, Calendar } from 'lucide-react';
import { useBuildingActiveVideos } from '@/hooks/useBuildingActiveVideos';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ModernSkeleton from '@/components/ui/ModernSkeleton';
import { generateCommercialPath } from '@/utils/buildingSlugUtils';
import { generatePublicUrl } from '@/config/domain';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BuildingVideoPlaylistPreviewProps {
  buildingId: string;
  buildingName: string;
  buildingCode: string;
  isOpen: boolean;
  onClose: () => void;
}

export const BuildingVideoPlaylistPreview: React.FC<BuildingVideoPlaylistPreviewProps> = ({
  buildingId,
  buildingName,
  buildingCode,
  isOpen,
  onClose
}) => {
  const { videos, loading, isUpdating, error } = useBuildingActiveVideos(buildingId);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const selectedVideo = videos[selectedVideoIndex];
  const commercialUrl = generatePublicUrl(generateCommercialPath(buildingName, buildingCode));

  const handleVideoSelect = (index: number) => {
    setSelectedVideoIndex(index);
    setIsPlaying(false);
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  React.useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      setIsPlaying(false);
    }
  }, [selectedVideoIndex]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh] p-0 gap-0 bg-background flex flex-col overflow-hidden">
        {/* Header Fixo */}
        <div className="px-4 sm:px-6 py-4 border-b bg-background flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1">
                Vídeos em Exibição - {buildingName}
              </h2>
              <p className="text-muted-foreground flex items-center gap-2 flex-wrap text-sm">
                {isUpdating && <span className="text-blue-500 animate-pulse">🔄 Atualizando...</span>}
                {loading ? 'Carregando playlist...' : `${videos.length} ${videos.length === 1 ? 'vídeo ativo' : 'vídeos ativos'}`}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(commercialUrl, '_blank')}
              className="shrink-0"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Ver Link Público</span>
              <span className="sm:hidden">Público</span>
            </Button>
          </div>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full w-full">
            {loading ? (
              <div className="p-4 sm:p-6 space-y-4">
                <ModernSkeleton className="w-full h-48 sm:h-64 rounded-lg" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <ModernSkeleton className="h-32" />
                  <ModernSkeleton className="h-32" />
                  <ModernSkeleton className="h-32 hidden lg:block" />
                </div>
              </div>
            ) : error ? (
              <div className="p-6 text-center">
                <p className="text-destructive">Erro ao carregar vídeos: {error}</p>
              </div>
            ) : videos.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                <Video className="h-16 w-16 mb-4 text-muted-foreground" />
                <p className="text-foreground text-lg font-medium mb-2">Nenhum vídeo em exibição</p>
                <p className="text-muted-foreground text-sm max-w-md">
                  Nenhum vídeo está sendo exibido neste momento. Verifique os horários programados.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 p-4 sm:p-6">
                {/* Player Principal */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Video Player */}
                  <div className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-lg border group">
                    {selectedVideo && (
                      <>
                        <video
                          ref={videoRef}
                          key={selectedVideo.video_id}
                          src={selectedVideo.video_url}
                          className="w-full h-full object-contain"
                          onPlay={() => setIsPlaying(true)}
                          onPause={() => setIsPlaying(false)}
                          onEnded={() => setIsPlaying(false)}
                        />
                        
                        {/* Play/Pause Overlay */}
                        <div 
                          className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          onClick={handlePlayPause}
                        >
                          <Button
                            size="lg"
                            className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-white/90 hover:bg-white text-foreground shadow-xl"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayPause();
                            }}
                          >
                            {isPlaying ? (
                              <Pause className="h-6 w-6 sm:h-8 sm:w-8" />
                            ) : (
                              <Play className="h-6 w-6 sm:h-8 sm:w-8 ml-1" />
                            )}
                          </Button>
                        </div>
                        
                        <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                          <Badge className="bg-green-600 text-white shadow-md text-xs">
                            🔴 Ao Vivo
                          </Badge>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Info do Vídeo */}
                  {selectedVideo && (
                    <div className="bg-card rounded-lg p-4 sm:p-5 border shadow-sm">
                      <h3 className="text-card-foreground font-semibold text-base sm:text-lg mb-3 sm:mb-4 truncate">
                        {selectedVideo.video_name}
                      </h3>
                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-sm font-medium">{formatDuration(selectedVideo.video_duracao)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                          <User className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-sm font-medium truncate">{selectedVideo.client_email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <DollarSign className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-sm font-medium">{formatCurrency(selectedVideo.valor_total)}</span>
                        </div>
                        {selectedVideo.created_at && (
                          <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                            <Calendar className="h-4 w-4 text-primary shrink-0" />
                            <span className="text-sm font-medium truncate">
                              {formatDistanceToNow(new Date(selectedVideo.created_at), { 
                                addSuffix: true, 
                                locale: ptBR 
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Playlist Lateral */}
                <div className="lg:col-span-1">
                  <div className="bg-card rounded-lg border shadow-sm overflow-hidden" style={{height: 'calc(90vh - 200px)'}}>
                    <div className="p-4 border-b">
                      <h3 className="text-card-foreground font-semibold flex items-center gap-2">
                        <Video className="h-5 w-5 text-primary" />
                        Playlist ({videos.length})
                      </h3>
                    </div>
                    <div className="overflow-y-auto" style={{height: 'calc(100% - 60px)'}}>
                      <div className="space-y-2 p-4">
                        {videos.map((video, index) => (
                          <button
                            key={video.video_id}
                            onClick={() => handleVideoSelect(index)}
                            className={`w-full text-left p-3 rounded-lg transition-all border ${
                              index === selectedVideoIndex
                                ? 'bg-primary/10 border-primary shadow-sm'
                                : 'bg-muted/50 border-border hover:bg-muted'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                index === selectedVideoIndex
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted-foreground/20 text-muted-foreground'
                              }`}>
                                {index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-card-foreground font-medium text-sm truncate mb-1">
                                  {video.video_name}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                  <User className="h-3 w-3 shrink-0" />
                                  <span className="truncate">{video.client_email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3 shrink-0" />
                                  {formatDuration(video.video_duracao)}
                                </div>
                                {video.created_at && (
                                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70 mt-1">
                                    <Calendar className="h-2.5 w-2.5 shrink-0" />
                                    <span className="truncate">
                                      {formatDistanceToNow(new Date(video.created_at), { 
                                        addSuffix: true, 
                                        locale: ptBR 
                                      })}
                                    </span>
                                  </div>
                                )}
                              </div>
                              {index === selectedVideoIndex && isPlaying && (
                                <Play className="h-4 w-4 text-primary flex-shrink-0 animate-pulse" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
