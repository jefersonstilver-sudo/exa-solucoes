import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Pause, Clock, User, DollarSign, Video, ExternalLink, Calendar } from 'lucide-react';
import { useBuildingActiveVideos, BuildingActiveVideo } from '@/hooks/useBuildingActiveVideos';
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
  const { videos, loading, error } = useBuildingActiveVideos(buildingId);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const selectedVideo = videos[selectedVideoIndex];
  const commercialUrl = generatePublicUrl(generateCommercialPath(buildingName, buildingCode));

  const handleVideoSelect = (index: number) => {
    setSelectedVideoIndex(index);
    setIsPlaying(false);
  };

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
      <DialogContent className="max-w-6xl max-h-[90vh] p-0 gap-0 bg-white">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold text-gray-900 mb-1">
                Vídeos em Exibição - {buildingName}
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                {loading ? 'Carregando playlist...' : `${videos.length} ${videos.length === 1 ? 'vídeo ativo' : 'vídeos ativos'}`}
              </DialogDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(commercialUrl, '_blank')}
              className="ml-4 bg-primary/5 border-primary/30 text-primary hover:bg-primary/10"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver Link Público
            </Button>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="p-6 space-y-4">
            <ModernSkeleton className="w-full h-64" />
            <div className="grid grid-cols-3 gap-4">
              <ModernSkeleton className="h-32" />
              <ModernSkeleton className="h-32" />
              <ModernSkeleton className="h-32" />
            </div>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-red-600">Erro ao carregar vídeos: {error}</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="p-12 text-center">
            <Video className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-700 text-lg font-medium mb-2">Nenhum vídeo em exibição</p>
            <p className="text-gray-500 text-sm">
              Nenhum vídeo está sendo exibido neste momento. Verifique os horários programados.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 bg-gray-50">
            {/* Player Principal */}
            <div className="lg:col-span-2 space-y-4">
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-lg border border-gray-200">
                {selectedVideo && (
                  <>
                    <video
                      key={selectedVideo.video_id}
                      src={selectedVideo.video_url}
                      className="w-full h-full object-contain"
                      controls
                      autoPlay={isPlaying}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                    />
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-green-600 text-white shadow-md">
                        🔴 Ao Vivo Agora
                      </Badge>
                    </div>
                  </>
                )}
              </div>

              {/* Info do Vídeo Selecionado */}
              {selectedVideo && (
                <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
                  <h3 className="text-gray-900 font-semibold text-lg mb-4">
                    {selectedVideo.video_name}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{formatDuration(selectedVideo.video_duracao)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <User className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium truncate">{selectedVideo.client_email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{formatCurrency(selectedVideo.valor_total)}</span>
                    </div>
                    {selectedVideo.created_at && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">
                          Enviado {formatDistanceToNow(new Date(selectedVideo.created_at), { 
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

            {/* Playlist */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm h-full">
                <h3 className="text-gray-900 font-semibold mb-4 flex items-center gap-2">
                  <Video className="h-5 w-5 text-primary" />
                  Playlist ({videos.length})
                </h3>
                <ScrollArea className="h-[calc(100%-3rem)]">
                  <div className="space-y-2 pr-4">
                    {videos.map((video, index) => (
                      <button
                        key={video.video_id}
                        onClick={() => handleVideoSelect(index)}
                        className={`w-full text-left p-3 rounded-lg transition-all ${
                          index === selectedVideoIndex
                            ? 'bg-primary/10 border-2 border-primary shadow-sm'
                            : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            index === selectedVideoIndex
                              ? 'bg-primary text-white'
                              : 'bg-gray-300 text-gray-700'
                          }`}>
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-900 font-medium text-sm truncate mb-1">
                              {video.video_name}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                              <User className="h-3 w-3" />
                              <span className="truncate">{video.client_email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              {formatDuration(video.video_duracao)}
                            </div>
                            {video.created_at && (
                              <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-1">
                                <Calendar className="h-2.5 w-2.5" />
                                Enviado {formatDistanceToNow(new Date(video.created_at), { 
                                  addSuffix: true, 
                                  locale: ptBR 
                                })}
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
                </ScrollArea>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
