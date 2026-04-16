import React, { useState, useEffect, useRef } from 'react';
import { Play, CheckCircle, Clock, XCircle, Pause, Calendar, Zap, Radio } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface VideoListItemProps {
  id: string;
  nome: string;
  url: string;
  duracao: number;
  approvalStatus: string;
  horasExibidas: number;
  exibicoes?: number;
  isActive?: boolean;
  selectedForDisplay?: boolean;
  scheduleInfo?: string;
  totalTelas?: number;
  isVertical?: boolean;
  isCurrentlyDisplaying?: boolean;
}

export const VideoListItem = ({
  nome,
  url,
  duracao,
  approvalStatus,
  horasExibidas,
  exibicoes = 0,
  isActive = true,
  selectedForDisplay = true,
  scheduleInfo = '24/7',
  totalTelas = 1,
  isVertical = false,
  isCurrentlyDisplaying = false,
}: VideoListItemProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [liveExibicoes, setLiveExibicoes] = useState(exibicoes);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
  
  // Use the RPC-determined value — only ONE video per order is truly displaying
  const isDisplaying = isCurrentlyDisplaying;
  
  // Whether the video has a schedule (but may not be active right now)
  const hasSchedule = approvalStatus === 'approved' && (
    (scheduleInfo?.startsWith('Agendado')) || 
    (scheduleInfo?.startsWith('Base:')) ||
    (isActive && selectedForDisplay)
  );

  // Real-time ticker: increment exhibitions live
  // Horizontal: cycle=480s, appears 3 times → every 160s per screen
  // Vertical: cycle=480s, appears 1 time → every 480s per screen
  // With multiple screens: interval = baseInterval / totalTelas
  useEffect(() => {
    setLiveExibicoes(exibicoes);
  }, [exibicoes]);

  useEffect(() => {
    if (!isDisplaying) return;

    // Seconds between each +1 exhibition for ALL screens combined
    const baseIntervalSec = isVertical ? 480 : 160; // 480s for vertical, 160s (2m40s) for horizontal
    const tickMs = Math.max(1000, (baseIntervalSec / Math.max(1, totalTelas)) * 1000);

    intervalRef.current = setInterval(() => {
      setLiveExibicoes(prev => prev + 1);
    }, tickMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isDisplaying, totalTelas, isVertical]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        if (isDisplaying) {
          return (
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100 animate-pulse">
              <Radio className="w-3 h-3 mr-1" />
              Em Exibição
            </Badge>
          );
        }
        if (hasSchedule) {
          // Has a schedule but not the currently active video
          const isScheduledType = scheduleInfo?.startsWith('Agendado');
          return (
            <Badge className={cn(
              "hover:bg-opacity-100",
              isScheduledType 
                ? "bg-purple-100 text-purple-800 border-purple-200" 
                : "bg-amber-100 text-amber-800 border-amber-200"
            )}>
              <Calendar className="w-3 h-3 mr-1" />
              {isScheduledType ? 'Agendado' : 'Base'}
            </Badge>
          );
        }
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
    if (isDisplaying) {
      // Currently playing — show schedule info
      if (scheduleInfo === '24/7') {
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100 text-[10px]">
            <Zap className="w-2.5 h-2.5 mr-1" />
            24/7
          </Badge>
        );
      }
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 text-[10px]">
          <Radio className="w-2.5 h-2.5 mr-1" />
          {scheduleInfo?.replace('Agendado: ', '').replace('Base: ', '')}
        </Badge>
      );
    }
    
    if (hasSchedule && scheduleInfo && scheduleInfo !== '24/7') {
      // Has schedule but not active now — show days info
      return (
        <Badge className="bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-100 text-[10px]">
          <Calendar className="w-2.5 h-2.5 mr-1" />
          {scheduleInfo.replace('Agendado: ', '').replace('Base: ', '')}
        </Badge>
      );
    }
    
    if (!hasSchedule) {
      return (
        <Badge className="bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100 text-[10px]">
          <Pause className="w-2.5 h-2.5 mr-1" />
          Não exibindo
        </Badge>
      );
    }

    return null;
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

  const isScheduledType = scheduleInfo?.startsWith('Agendado') || scheduleInfo?.startsWith('Base:');

  return (
    <div className={cn(
      "flex items-center gap-4 p-4 bg-background border-b border-border/40 hover:bg-accent/5 transition-colors group",
      isDisplaying && "border-l-4 border-l-emerald-500 bg-emerald-50/30",
      !isDisplaying && hasSchedule && "opacity-80",
      !isDisplaying && !hasSchedule && "opacity-50 bg-muted/30"
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

        {/* Live indicator dot */}
        {isDisplaying && (
          <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-sm" />
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

      {/* Exibições com contador em tempo real */}
      <div className="text-right flex-shrink-0">
        <p className={cn(
          "text-2xl font-bold tabular-nums",
          isDisplaying ? "text-[#9C1E1E]" : "text-muted-foreground"
        )}>
          {liveExibicoes.toLocaleString('pt-BR')}
        </p>
        <p className="text-xs text-muted-foreground">
          {isDisplaying ? 'exibições' : 'sem exibição'}
        </p>
        {isDisplaying && (
          <p className="text-[10px] text-emerald-600 flex items-center justify-end gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse inline-block" />
            ao vivo
          </p>
        )}
      </div>
    </div>
  );
};
