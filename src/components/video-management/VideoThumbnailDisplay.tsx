import React, { useState } from 'react';
import { Loader2, PlayCircle, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface VideoThumbnailDisplayProps {
  videoUrl: string;
  videoName: string;
  className?: string;
  compact?: boolean;
}

export const VideoThumbnailDisplay: React.FC<VideoThumbnailDisplayProps> = ({
  videoUrl,
  videoName,
  className = '',
  compact = false
}) => {
  const [thumbnailError, setThumbnailError] = useState(false);
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);

  const handleVideoError = () => {
    console.error('❌ [THUMBNAIL] Erro ao carregar thumbnail do vídeo');
    setThumbnailError(true);
  };

  const handleVideoLoad = () => {
    console.log('✅ [THUMBNAIL] Thumbnail carregado com sucesso');
    setThumbnailLoaded(true);
  };

  const truncatedName = videoName.length > 20 ? `${videoName.substring(0, 20)}...` : videoName;

  if (thumbnailError) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded ${compact ? 'h-8' : 'h-16'} ${className}`}>
        <div className="flex items-center space-x-2 text-gray-500">
          <AlertCircle className={`${compact ? 'h-3 w-3' : 'h-4 w-4'}`} />
          <span className={`${compact ? 'text-xs' : 'text-sm'} font-medium`}>
            Erro na miniatura
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Thumbnail */}
      <div className={`relative bg-gray-100 rounded overflow-hidden flex-shrink-0 ${compact ? 'w-12 h-8' : 'w-16 h-12'}`}>
        {!thumbnailLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className={`animate-spin text-gray-400 ${compact ? 'h-3 w-3' : 'h-4 w-4'}`} />
          </div>
        )}
        
        <video
          src={videoUrl}
          className={`w-full h-full object-cover ${!thumbnailLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity`}
          onLoadedData={handleVideoLoad}
          onError={handleVideoError}
          muted
          playsInline
          preload="metadata"
        />
        
        {thumbnailLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <PlayCircle className={`text-white/80 ${compact ? 'h-3 w-3' : 'h-4 w-4'}`} />
          </div>
        )}
      </div>

      {/* Nome do vídeo com tooltip */}
      <div className="flex-1 min-w-0">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <p className={`text-gray-900 font-medium truncate ${compact ? 'text-xs' : 'text-sm'}`}>
                {compact ? truncatedName : videoName}
              </p>
            </TooltipTrigger>
            {(videoName.length > 20 || compact) && (
              <TooltipContent>
                <p className="max-w-xs break-words">{videoName}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
        <p className={`text-gray-500 ${compact ? 'text-xs' : 'text-xs'}`}>
          Em exibição
        </p>
      </div>
    </div>
  );
};