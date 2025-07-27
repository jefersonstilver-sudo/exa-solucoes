import React from 'react';
import { VideoInfo } from '@/hooks/useUnifiedCampaigns';
import { Badge } from '@/components/ui/badge';
import { Play, Clock, Maximize, Video } from 'lucide-react';

interface VideoPreviewProps {
  video: VideoInfo;
  className?: string;
  showDetails?: boolean;
}

export const VideoPreview = ({ video, className = '', showDetails = true }: VideoPreviewProps) => {
  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getOrientationIcon = (orientacao?: string) => {
    return orientacao === 'vertical' ? (
      <Maximize className="h-3 w-3 rotate-90" />
    ) : (
      <Maximize className="h-3 w-3" />
    );
  };

  return (
    <div className={`relative group ${className}`}>
      {/* Video thumbnail/poster area */}
      <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border">
        {video.url ? (
          <video 
            src={video.url} 
            className="w-full h-full object-cover"
            preload="metadata"
            muted
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50">
            <Video className="h-8 w-8 text-gray-400" />
          </div>
        )}
        
        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-white/90 rounded-full p-2">
            <Play className="h-4 w-4 text-gray-800" />
          </div>
        </div>
      </div>

      {showDetails && (
        <div className="mt-2 space-y-1">
          {/* Video name */}
          <p className="text-sm font-medium text-gray-900 line-clamp-1">
            {video.nome}
          </p>
          
          {/* Video details */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {video.duracao && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(video.duracao)}
              </div>
            )}
            
            {video.orientacao && (
              <div className="flex items-center gap-1">
                {getOrientationIcon(video.orientacao)}
                <span className="capitalize">{video.orientacao}</span>
              </div>
            )}
            
            {video.formato && (
              <Badge variant="outline" className="text-xs px-1 py-0">
                {video.formato.toUpperCase()}
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
};