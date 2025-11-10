import React, { useState, useRef } from 'react';
import { Play, User, Clock, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoPreviewCardProps {
  video: {
    video_id: string;
    video_name: string;
    video_url: string;
    client_name?: string;
    is_scheduled?: boolean;
    video_duracao?: number;
  };
}

const VideoPreviewCard: React.FC<VideoPreviewCardProps> = ({ video }) => {
  const [isHovering, setIsHovering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout>();

  const handleMouseEnter = () => {
    // Delay de 500ms antes de carregar o preview
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovering(true);
      setIsLoading(true);
    }, 500);
  };

  const handleMouseLeave = () => {
    // Cancelar o timeout se o mouse sair antes
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsHovering(false);
    setIsLoading(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const handleVideoCanPlay = () => {
    setIsLoading(false);
    if (videoRef.current && isHovering) {
      videoRef.current.play();
    }
  };

  return (
    <div
      className="relative group cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Card base */}
      <div className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300">
        {/* Thumbnail/Preview */}
        <div className="relative aspect-video bg-muted">
          {!isHovering ? (
            // Thumbnail placeholder
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <Play className="h-8 w-8 text-primary opacity-60" />
            </div>
          ) : (
            // Video preview
            <>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}
              <video
                ref={videoRef}
                src={video.video_url}
                className={cn(
                  "absolute inset-0 w-full h-full object-cover transition-opacity duration-300",
                  isLoading ? "opacity-0" : "opacity-100"
                )}
                muted
                loop
                playsInline
                preload="metadata"
                onCanPlay={handleVideoCanPlay}
              />
            </>
          )}

          {/* Badge de status */}
          {video.is_scheduled && (
            <div className="absolute top-2 right-2 z-20">
              <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-500 text-white rounded text-xs font-semibold">
                <Calendar className="h-3 w-3" />
                <span>Programado</span>
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-2 space-y-1">
          <h4 className="text-xs font-medium truncate" title={video.video_name}>
            {video.video_name}
          </h4>
          
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            {video.client_name && (
              <div className="flex items-center gap-1 truncate">
                <User className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{video.client_name}</span>
              </div>
            )}
            {video.video_duracao && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{Math.round(video.video_duracao)}s</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hover effect overlay */}
      <div className="absolute inset-0 rounded-lg ring-2 ring-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
};

export default VideoPreviewCard;
