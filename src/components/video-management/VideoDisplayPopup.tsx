import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Clock, Video, ExternalLink, Calendar, Activity } from 'lucide-react';
import { useOrderCurrentVideoData } from '@/hooks/useOrderCurrentVideoData';
import { useCurrentVideoDisplay } from '@/hooks/useCurrentVideoDisplay';
import { VideoPlayerCore } from './VideoPlayerCore';

interface VideoDisplayPopupProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const VideoDisplayPopup: React.FC<VideoDisplayPopupProps> = ({
  orderId,
  isOpen,
  onClose
}) => {
  const { videoData, loading, error } = useOrderCurrentVideoData(orderId);
  const { currentVideo, loading: currentVideoLoading } = useCurrentVideoDisplay({ 
    orderId, 
    enabled: !!orderId && isOpen 
  });
  const videoRef = React.useRef<HTMLVideoElement>(null);

  // Determinar tipo e status do vídeo
  const videoType = currentVideo?.is_scheduled ? 'Vídeo Agendado' : 'Vídeo Principal';
  const isScheduled = currentVideo?.is_scheduled;

  if (loading || currentVideoLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl">
          <DialogHeader className="space-y-4">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Play className="h-5 w-5 text-primary" />
              </div>
              <span>Vídeo em Exibição</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground font-medium">Carregando dados do vídeo...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !videoData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl">
          <DialogHeader className="space-y-4">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Video className="h-5 w-5 text-muted-foreground" />
              </div>
              <span>Vídeo em Exibição</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col items-center justify-center py-12 space-y-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/50">
              <Video className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-muted-foreground">
                Nenhum vídeo em exibição
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Não há vídeos sendo exibidos no momento para este pedido
              </p>
            </div>
            <Button onClick={onClose} variant="outline" size="lg">
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        {/* Header com Badge de Status */}
        <DialogHeader className="space-y-6 pb-6 border-b">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Play className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-2">
                <DialogTitle className="text-2xl font-bold">
                  Vídeo em Exibição
                </DialogTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                    <Activity className="h-3 w-3 mr-1" />
                    EM EXIBIÇÃO
                  </Badge>
                  {isScheduled && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                      <Calendar className="h-3 w-3 mr-1" />
                      AGENDADO
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Nome do Vídeo */}
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">
              {videoData.videoName}
            </h2>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Reproduzindo atualmente</span>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-8 py-6">
          {/* Player de Vídeo Responsivo */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Preview do Vídeo</h3>
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                  <VideoPlayerCore
                    videoRef={videoRef}
                    src={videoData.videoUrl}
                    autoPlay={false}
                    muted={true}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Overlay de Controles Redesenhado */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-center justify-center opacity-0 hover:opacity-100 transition-all duration-300">
                    <Button
                      size="lg"
                      variant="secondary"
                      className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-white/30 shadow-lg"
                      onClick={() => {
                        if (videoRef.current) {
                          if (videoRef.current.paused) {
                            videoRef.current.play();
                          } else {
                            videoRef.current.pause();
                          }
                        }
                      }}
                    >
                      <Play className="h-5 w-5 mr-2" />
                      Reproduzir Preview
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Informações Organizadas em Cards */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informações do Vídeo</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Status Card */}
              <Card>
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-sm text-muted-foreground">STATUS</span>
                  </div>
                  <p className="text-lg font-semibold text-green-600">
                    Em Exibição
                  </p>
                </CardContent>
              </Card>

              {/* Tipo Card */}
              <Card>
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center gap-2">
                    <Video className="h-5 w-5 text-primary" />
                    <span className="font-medium text-sm text-muted-foreground">TIPO</span>
                  </div>
                  <p className={`text-lg font-semibold ${isScheduled ? 'text-blue-600' : 'text-green-600'}`}>
                    {videoType}
                  </p>
                </CardContent>
              </Card>

              {/* Programação Card (só aparece se agendado) */}
              {isScheduled && (
                <Card className="md:col-span-2 lg:col-span-1">
                  <CardContent className="p-6 space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-sm text-muted-foreground">PROGRAMAÇÃO</span>
                    </div>
                    <p className="text-sm text-blue-600 font-medium leading-relaxed">
                      Agendamento ativo - verifique os horários no gerenciamento de vídeos
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Ações Redesenhadas */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
            <Button 
              variant="outline" 
              onClick={onClose}
              size="lg"
              className="flex-1 sm:flex-none"
            >
              Fechar
            </Button>
            <Button 
              onClick={() => window.open(videoData.videoUrl, '_blank')}
              size="lg"
              className="flex-1 sm:flex-none bg-primary hover:bg-primary/90"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir Vídeo Completo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};