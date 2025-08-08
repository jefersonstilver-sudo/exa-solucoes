import React, { useState } from 'react';
import { Video, Loader2, AlertCircle, Play } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface VideoThumbnailDisplayProps {
  videoUrl?: string;
  videoName?: string;
  loading?: boolean;
  error?: string | null;
  compact?: boolean;
  className?: string;
}

export const VideoThumbnailDisplay: React.FC<VideoThumbnailDisplayProps> = ({
  videoUrl,
  videoName,
  loading = false,
  error = null,
  compact = false,
  className = ''
}) => {
  const [thumbnailError, setThumbnailError] = useState(false);

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className={`flex items-center justify-center bg-muted rounded ${compact ? 'w-8 h-6' : 'w-12 h-8'}`}>
          <Loader2 className={`animate-spin text-muted-foreground ${compact ? 'h-3 w-3' : 'h-4 w-4'}`} />
        </div>
        {!compact && (
          <div className="flex-1">
            <div className="h-3 bg-muted rounded animate-pulse"></div>
          </div>
        )}
      </div>
    );
  }

  if (error || !videoUrl || !videoName) {
    return (
      <div className={`flex items-center space-x-2 text-muted-foreground ${className}`}>
        <div className={`flex items-center justify-center bg-muted rounded ${compact ? 'w-8 h-6' : 'w-12 h-8'}`}>
          <Video className={`${compact ? 'h-3 w-3' : 'h-4 w-4'}`} />
        </div>
        {!compact && (
          <span className={`${compact ? 'text-xs' : 'text-sm'}`}>
            {error || 'Nenhum vídeo em exibição'}
          </span>
        )}
      </div>
    );
  }

  const displayName = videoName.length > 25 ? `${videoName.substring(0, 25)}...` : videoName;

  return (
    <TooltipProvider>
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className={`relative bg-black rounded overflow-hidden ${compact ? 'w-8 h-6' : 'w-12 h-8'}`}>
          {!thumbnailError ? (
            <video
              src={videoUrl}
              className="w-full h-full object-cover"
              onError={() => setThumbnailError(true)}
              preload="metadata"
              muted
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <Play className={`text-muted-foreground ${compact ? 'h-2 w-2' : 'h-3 w-3'}`} />
            </div>
          )}
        </div>
        
        {!compact && (
          <div className="flex-1 min-w-0">
            {videoName.length > 25 ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className={`truncate font-medium text-foreground ${compact ? 'text-xs' : 'text-sm'}`}>
                    {displayName}
                  </p>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs break-words">{videoName}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <p className={`truncate font-medium text-foreground ${compact ? 'text-xs' : 'text-sm'}`}>
                {videoName}
              </p>
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};