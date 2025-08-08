import React from 'react';
import { useOrderCurrentVideoData } from '@/hooks/useOrderCurrentVideoData';
import { VideoThumbnailDisplay } from './VideoThumbnailDisplay';

interface OrderVideoThumbnailProps {
  orderId: string;
  compact?: boolean;
  className?: string;
}

export const OrderVideoThumbnail: React.FC<OrderVideoThumbnailProps> = ({
  orderId,
  compact = false,
  className = ''
}) => {
  const { videoData, loading, error } = useOrderCurrentVideoData({ 
    orderId,
    enabled: true 
  });

  return (
    <VideoThumbnailDisplay
      videoUrl={videoData?.url}
      videoName={videoData?.nome}
      loading={loading}
      error={error}
      compact={compact}
      className={className}
    />
  );
};