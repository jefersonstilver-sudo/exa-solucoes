import React, { useState } from 'react';
import { Play, CheckCircle, Clock, XCircle, Pause, Calendar, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface VideoListItemProps {
  id: string;
  nome: string;
  url: string;
  duracao: number;
  approvalStatus: string;
  horasExibidas: number;
  isActive?: boolean;
  selectedForDisplay?: boolean;
  scheduleInfo?: string;
}

export const VideoListItem = ({
  nome,
  url,
  duracao,
  approvalStatus,
  horasExibidas,
  isActive = true,
  selectedForDisplay = true,
  scheduleInfo = '24/7',
}: VideoListItemProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoError, setVideoError] = useState(false);

  // Format display time: show h/min/s depending on magnitude
  const formatDisplayTime = (hours: number): string => {
    const totalSeconds = Math.round(hours * 3600);
    if (totalSeconds < 60) {
      return `${totalSeconds}s`;
    }
    if (totalSeconds < 3600) {
      const min = Math.floor(totalSeconds / 60);
      const sec = totalSeconds % 60;
      return sec > 0 ? `${min}m${sec}s` : `${min}min`;
    }
    return `${hours.toFixed(1)}h`;
  };
  
  const isDisplaying = (isActive && selectedForDisplay && approvalStatus === 'approved') 
    || (approvalStatus === 'approved' && scheduleInfo !== undefined && (scheduleInfo.startsWith('Agendado') || scheduleInfo.startsWith('Base:')));

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

  const getScheduleBadge = () => {
    if (!isDisplaying) {
      return (
        <Badge className="bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100 text-[10px]">
          <Pause className="w-2.5 h-2.5 mr-1" />
          Não exibindo
        </Badge>
      );
    }
    
    if (scheduleInfo === '24/7') {
      return (
        <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100 text-[10px]">
          <Zap className="w-2.5 h-2.5 mr-1" />
          24/7
        </Badge>
      );
    }
    
    return (
      <Badge className="bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100 text-[10px]">
        <Calendar className="w-2.5 h-2.5 mr-1" />
        {scheduleInfo.replace('Agendado: ', '')}
      </Badge>
    );
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
    <div className={cn(
      "flex items-center gap-4 p-4 bg-background border-b border-border/40 hover:bg-accent/5 transition-colors group",
      !isDisplaying && "opacity-60 bg-muted/30"
    )}>
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
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <h5 className="font-medium text-sm text-foreground truncate">
            {nome}
          </h5>
          {getScheduleBadge()}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {getStatusBadge(approvalStatus)}
          <span className="text-xs text-muted-foreground">
            {duracao}s
          </span>
        </div>
      </div>

      {/* Tempo real exibido */}
      <div className="text-right flex-shrink-0">
        {isDisplaying && horasExibidas === 0 ? (
          <>
            <p className="text-sm font-medium text-muted-foreground">—</p>
            <p className="text-xs text-muted-foreground">aguardando dados</p>
          </>
        ) : (
          <>
            <p className={cn(
              "text-2xl font-bold",
              isDisplaying ? "text-[#9C1E1E]" : "text-muted-foreground"
            )}>
              {formatDisplayTime(horasExibidas)}
            </p>
            <p className="text-xs text-muted-foreground">
              {isDisplaying ? 'total exibido' : 'sem exibição'}
            </p>
          </>
        )}
      </div>
    </div>
  );
};
