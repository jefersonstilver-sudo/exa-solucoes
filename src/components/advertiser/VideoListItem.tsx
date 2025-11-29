import React, { useState } from 'react';
import { Play, CheckCircle, Clock, XCircle, Pause } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface VideoListItemProps {
  id: string;
  nome: string;
  url: string;
  duracao: number;
  approvalStatus: string;
  horasExibidas: number;
}

export const VideoListItem = ({
  nome,
  url,
  duracao,
  approvalStatus,
  horasExibidas
}: VideoListItemProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Aprovado
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100">
            <Clock className="w-3 h-3 mr-1" />
            Em Análise
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100">
            <XCircle className="w-3 h-3 mr-1" />
            Rejeitado
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleVideoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const videoElement = e.currentTarget.querySelector('video') as HTMLVideoElement;
    if (videoElement) {
      if (isPlaying) {
        videoElement.pause();
      } else {
        videoElement.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-background border-b border-border/40 hover:bg-accent/5 transition-colors group">
      {/* Thumbnail com play */}
      <div
        className="relative w-28 h-20 rounded-lg overflow-hidden cursor-pointer flex-shrink-0 bg-muted"
        onClick={handleVideoClick}
      >
        {url && !videoError ? (
          <>
            <video
              src={url}
              className="w-full h-full object-cover"
              preload="metadata"
              onError={() => setVideoError(true)}
            />
            <div className={cn(
              "absolute inset-0 flex items-center justify-center transition-all duration-300",
              isPlaying ? "bg-black/10" : "bg-black/30 group-hover:bg-black/40"
            )}>
              {isPlaying ? (
                <div className="bg-white/90 backdrop-blur-sm rounded-full p-2">
                  <Pause className="w-5 h-5 text-[#9C1E1E]" />
                </div>
              ) : (
                <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 scale-90 group-hover:scale-100 transition-transform">
                  <Play className="w-5 h-5 text-[#9C1E1E]" />
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-accent/10">
            <Play className="w-8 h-8 text-muted-foreground/30" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h5 className="font-medium text-sm text-foreground truncate mb-2">
          {nome}
        </h5>
        <div className="flex items-center gap-3">
          {getStatusBadge(approvalStatus)}
          <span className="text-xs text-muted-foreground">
            {duracao}s
          </span>
        </div>
      </div>

      {/* Horas exibidas */}
      <div className="text-right flex-shrink-0">
        <p className="text-2xl font-bold text-[#9C1E1E]">
          {horasExibidas.toFixed(1)}h
        </p>
        <p className="text-xs text-muted-foreground">
          total exibido
        </p>
      </div>
    </div>
  );
};
