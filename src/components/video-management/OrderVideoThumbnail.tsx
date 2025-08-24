import React from 'react';
import { Loader2, Video } from 'lucide-react';
import { useOrderCurrentVideoData } from '@/hooks/useOrderCurrentVideoData';
import { VideoThumbnailDisplay } from './VideoThumbnailDisplay';

interface OrderVideoThumbnailProps {
  orderId: string;
  orderStatus: string;
  className?: string;
  compact?: boolean;
}

export const OrderVideoThumbnail: React.FC<OrderVideoThumbnailProps> = ({
  orderId,
  orderStatus,
  className = '',
  compact = false
}) => {
  const { videoData, loading, error } = useOrderCurrentVideoData(orderId);

  // Só mostrar para pedidos com vídeos aprovados ou ativos
  const shouldShowVideo = orderStatus.toLowerCase() === 'video_aprovado';

  if (!shouldShowVideo) {
    return null;
  }

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Loader2 className={`animate-spin text-gray-400 ${compact ? 'h-3 w-3' : 'h-4 w-4'}`} />
        <span className={`text-gray-500 ${compact ? 'text-xs' : 'text-sm'}`}>
          Carregando vídeo...
        </span>
      </div>
    );
  }

  if (error || !videoData) {
    return (
      <div className={`flex items-center space-x-2 text-gray-500 ${className}`}>
        <Video className={`${compact ? 'h-3 w-3' : 'h-4 w-4'}`} />
        <span className={`${compact ? 'text-xs' : 'text-sm'}`}>
          Nenhum vídeo em exibição
        </span>
      </div>
    );
  }

  return (
    <VideoThumbnailDisplay
      videoUrl={videoData.videoUrl}
      videoName={videoData.videoName}
      className={className}
      compact={compact}
    />
  );
};