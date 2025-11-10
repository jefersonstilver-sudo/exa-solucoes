import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useBuildingActiveVideos } from '@/hooks/useBuildingActiveVideos';
import { Video, Loader2, Clock, User } from 'lucide-react';
import VideoPreviewCard from './VideoPreviewCard';

interface VideosPopoverProps {
  buildingId: string;
  videoCount: number;
  children: React.ReactNode;
}

const VideosPopover: React.FC<VideosPopoverProps> = ({ buildingId, videoCount, children }) => {
  const { videos, loading } = useBuildingActiveVideos(buildingId);

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-[500px] max-h-[600px] overflow-y-auto p-4" align="start">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Video className="h-4 w-4 text-primary" />
              Vídeos em Exibição
            </h3>
            <span className="text-xs text-muted-foreground">
              {videoCount} ativo{videoCount > 1 ? 's' : ''}
            </span>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          {/* Videos grid */}
          {!loading && videos.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {videos.map((video) => (
                <VideoPreviewCard key={video.video_id} video={video} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && videos.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Video className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum vídeo ativo no momento</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default VideosPopover;
