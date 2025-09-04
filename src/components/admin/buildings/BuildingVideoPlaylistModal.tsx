import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Pause, SkipForward, SkipBack, Clock, User, DollarSign, RefreshCw } from 'lucide-react';
import { useBuildingActiveVideos, BuildingActiveVideo } from '@/hooks/useBuildingActiveVideos';
import { VideoPlayerCore } from '@/components/video-management/VideoPlayerCore';
import { useRef, useEffect } from 'react';

interface BuildingVideoPlaylistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  buildingId: string;
  buildingName: string;
}

export const BuildingVideoPlaylistModal: React.FC<BuildingVideoPlaylistModalProps> = ({
  open,
  onOpenChange,
  buildingId,
  buildingName
}) => {
  const { videos, loading, error, refetch } = useBuildingActiveVideos(buildingId);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentVideo = videos[currentVideoIndex];

  useEffect(() => {
    if (videos.length > 0 && currentVideoIndex >= videos.length) {
      setCurrentVideoIndex(0);
    }
  }, [videos.length, currentVideoIndex]);

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

  const handleVideoEnd = () => {
    // Avançar para o próximo vídeo automaticamente
    if (currentVideoIndex < videos.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
    } else {
      // Voltar ao primeiro vídeo (loop da playlist)
      setCurrentVideoIndex(0);
    }
  };

  const handlePrevious = () => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex(currentVideoIndex - 1);
    } else {
      setCurrentVideoIndex(videos.length - 1);
    }
  };

  const handleNext = () => {
    if (currentVideoIndex < videos.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
    } else {
      setCurrentVideoIndex(0);
    }
  };

  const handleVideoSelect = (index: number) => {
    setCurrentVideoIndex(index);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTotalDuration = () => {
    return videos.reduce((total, video) => total + video.video_duracao, 0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Playlist - {buildingName}</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {videos.length} vídeos
              </Badge>
              <Badge variant="outline">
                <Clock className="w-3 h-3 mr-1" />
                {formatDuration(getTotalDuration())}
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refetch}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">Carregando playlist...</p>
            </div>
          </div>
        )}

        {!loading && videos.length === 0 && (
          <div className="flex items-center justify-center h-96 text-center">
            <div>
              <Play className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Nenhum vídeo em exibição</h3>
              <p className="text-muted-foreground">
                Este prédio não possui vídeos ativos no momento.
              </p>
            </div>
          </div>
        )}

        {!loading && videos.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[70vh]">
            {/* Player Principal */}
            <div className="lg:col-span-2 space-y-4">
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <VideoPlayerCore
                  videoRef={videoRef}
                  src={currentVideo?.video_url || ''}
                  autoPlay={false}
                  muted={true}
                  className="w-full h-full"
                />
                
                {/* Overlay de controles */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <div className="flex items-center justify-between text-white">
                    <div>
                      <h3 className="font-medium text-lg">{currentVideo?.video_name}</h3>
                      <p className="text-sm opacity-75">
                        {currentVideo?.client_name} • {formatDuration(currentVideo?.video_duracao || 0)}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handlePrevious}
                        className="text-white hover:bg-white/20"
                      >
                        <SkipBack className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handlePlayPause}
                        className="text-white hover:bg-white/20"
                      >
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleNext}
                        className="text-white hover:bg-white/20"
                      >
                        <SkipForward className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informações do vídeo atual */}
              {currentVideo && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>Cliente: {currentVideo.client_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span>
                        Valor: {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(currentVideo.valor_total)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Badge variant={currentVideo.priority_type === 'scheduled' ? 'default' : 'secondary'}>
                      {currentVideo.priority_type === 'scheduled' ? '⏰ Agendado' : '🎯 Base'}
                    </Badge>
                    <Badge variant="outline">
                      Slot {currentVideo.slot_position}
                    </Badge>
                  </div>
                </div>
              )}
            </div>

            {/* Lista da Playlist */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Playlist ({videos.length})</h3>
                <span className="text-sm text-muted-foreground">
                  {currentVideoIndex + 1} de {videos.length}
                </span>
              </div>

              <ScrollArea className="h-full">
                <div className="space-y-2">
                  {videos.map((video, index) => (
                    <div
                      key={`${video.video_id}-${video.pedido_id}`}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        index === currentVideoIndex
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted/50'
                      }`}
                      onClick={() => handleVideoSelect(index)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium truncate text-sm">
                            {video.video_name}
                          </h4>
                          <p className="text-xs text-muted-foreground truncate">
                            {video.client_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDuration(video.video_duracao)}
                          </p>
                        </div>
                        
                        <div className="flex flex-col items-end gap-1">
                          {index === currentVideoIndex && (
                            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                          )}
                          <Badge 
                            variant={video.priority_type === 'scheduled' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {video.priority_type === 'scheduled' ? '⏰' : '🎯'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
      </DialogContent>

      {/* Event listeners para o vídeo */}
      {currentVideo && (
        <video
          ref={videoRef}
          style={{ display: 'none' }}
          onEnded={handleVideoEnd}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      )}
    </Dialog>
  );
};