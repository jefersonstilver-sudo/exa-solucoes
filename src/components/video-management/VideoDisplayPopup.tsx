import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Play, Clock, Video } from 'lucide-react';
import { useOrderCurrentVideoData } from '@/hooks/useOrderCurrentVideoData';
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
  const videoRef = React.useRef<HTMLVideoElement>(null);

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Play className="h-5 w-5 text-primary" />
              <span>Vídeo em Exibição</span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-muted-foreground">Carregando dados do vídeo...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !videoData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Video className="h-5 w-5 text-muted-foreground" />
              <span>Vídeo em Exibição</span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-8 space-y-4">
            <Video className="h-16 w-16 text-muted-foreground" />
            <p className="text-muted-foreground text-center">
              Nenhum vídeo está sendo exibido no momento
            </p>
            <Button onClick={onClose} variant="outline">
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Play className="h-5 w-5 text-primary" />
            <span>Vídeo em Exibição</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Nome do vídeo */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">{videoData.videoName}</h3>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Atualmente em exibição</span>
            </div>
          </div>

          {/* Player de vídeo */}
          <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
            <VideoPlayerCore
              videoRef={videoRef}
              src={videoData.videoUrl}
              autoPlay={false}
              muted={true}
              className="w-full h-full"
            />
            
            {/* Overlay de controles */}
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <Button
                size="lg"
                variant="secondary"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
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
                <Play className="h-6 w-6 mr-2" />
                Reproduzir Preview
              </Button>
            </div>
          </div>

          {/* Informações adicionais */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Status:</span>
                <span className="ml-2 font-medium text-green-600">Em Exibição</span>
              </div>
              <div>
                <span className="text-muted-foreground">Tipo:</span>
                <span className="ml-2 font-medium">Vídeo Principal</span>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
            <Button 
              onClick={() => window.open(videoData.videoUrl, '_blank')}
              className="bg-primary hover:bg-primary/90"
            >
              <Video className="h-4 w-4 mr-2" />
              Abrir Vídeo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};