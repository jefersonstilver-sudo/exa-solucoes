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
      <DialogContent className="max-w-6xl max-h-[90vh] p-0 gap-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold text-white mb-1">
                {buildingName}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                {loading ? 'Carregando playlist...' : `${videos.length} ${videos.length === 1 ? 'vídeo' : 'vídeos'} em exibição`}
              </DialogDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(commercialUrl, '_blank')}
              className="ml-4 bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir Link Comercial
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
            <p className="text-red-400">Erro ao carregar vídeos: {error}</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="p-6 text-center">
            <Video className="h-16 w-16 mx-auto mb-4 text-slate-600" />
            <p className="text-slate-400 text-lg">Nenhum vídeo em exibição</p>
            <p className="text-slate-500 text-sm mt-2">
              Configure vídeos para este prédio na seção de campanhas
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
            {/* Player Principal */}
            <div className="lg:col-span-2 space-y-4">
              <div className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10">
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
                    <div className="absolute top-4 left-4 flex gap-2">
                      {selectedVideo.is_scheduled ? (
                        <Badge className="bg-purple-500/90 text-white backdrop-blur-sm">
                          📅 Programado
                        </Badge>
                      ) : (
                        <Badge className="bg-green-500/90 text-white backdrop-blur-sm">
                          ⭐ Principal
                        </Badge>
                      )}
                      {selectedVideo.is_currently_active && (
                        <Badge className="bg-red-500/90 text-white backdrop-blur-sm animate-pulse">
                          🔴 Ao Vivo
                        </Badge>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Info do Vídeo Selecionado */}
              {selectedVideo && (
                <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                  <h3 className="text-white font-bold text-lg mb-3">
                    {selectedVideo.video_name}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">{formatDuration(selectedVideo.video_duracao)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <User className="h-4 w-4" />
                      <span className="text-sm truncate">{selectedVideo.client_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-sm">{formatCurrency(selectedVideo.valor_total)}</span>
                    </div>
                    {selectedVideo.created_at && (
                      <div className="flex items-center gap-2 text-slate-400">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm">
                          {formatDistanceToNow(new Date(selectedVideo.created_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {selectedVideo.schedule_rules && selectedVideo.schedule_rules.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-slate-400 text-xs mb-2">Programação:</p>
                      {selectedVideo.schedule_rules.map((rule, idx) => (
                        <div key={idx} className="text-slate-300 text-xs flex items-center gap-2">
                          <span className="text-purple-400">•</span>
                          {rule.is_all_day ? (
                            <span>Todo o dia</span>
                          ) : (
                            <span>{rule.start_time} - {rule.end_time}</span>
                          )}
                          <span className="text-slate-500">
                            ({['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].filter((_, i) => rule.days_of_week.includes(i)).join(', ')})
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Playlist */}
            <div className="lg:col-span-1">
              <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-4 border border-white/10 h-full">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                  <Video className="h-5 w-5" />
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
                            ? 'bg-red-500/20 border-2 border-red-500/50'
                            : 'bg-slate-800/50 border border-white/5 hover:bg-slate-800/80'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            index === selectedVideoIndex
                              ? 'bg-red-500 text-white'
                              : 'bg-slate-700 text-slate-300'
                          }`}>
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium text-sm truncate mb-1">
                              {video.video_name}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                              <Clock className="h-3 w-3" />
                              {formatDuration(video.video_duracao)}
                            </div>
                            {video.created_at && (
                              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                <Calendar className="h-2.5 w-2.5" />
                                {formatDistanceToNow(new Date(video.created_at), { 
                                  addSuffix: true, 
                                  locale: ptBR 
                                })}
                              </div>
                            )}
                            <div className="flex gap-1 mt-2">
                              {video.priority_type === 'base' && (
                                <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-green-500/30 text-green-400">
                                  Principal
                                </Badge>
                              )}
                              {video.is_scheduled && (
                                <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-purple-500/30 text-purple-400">
                                  Programado
                                </Badge>
                              )}
                              {video.is_currently_active && (
                                <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-red-500/30 text-red-400">
                                  Ao Vivo
                                </Badge>
                              )}
                            </div>
                          </div>
                          {index === selectedVideoIndex && isPlaying && (
                            <Play className="h-4 w-4 text-red-400 flex-shrink-0 animate-pulse" />
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
