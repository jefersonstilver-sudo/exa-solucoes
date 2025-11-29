import React from 'react';
import { Play, CheckCircle, Clock, XCircle } from 'lucide-react';
import { VideoInfo } from '@/hooks/useVideoReportData';
import { Badge } from '@/components/ui/badge';

interface VideoThumbnailGridProps {
  videos: VideoInfo[];
}

export const VideoThumbnailGrid = ({ videos }: VideoThumbnailGridProps) => {
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {videos.map((video) => (
        <div
          key={video.id}
          className="group bg-gradient-to-br from-background via-background to-accent/5 backdrop-blur-xl border border-border/40 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
        >
          <div className="relative aspect-video bg-muted">
            {video.url ? (
              <video
                src={video.url}
                className="w-full h-full object-cover"
                preload="metadata"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-accent/10">
                <Play className="w-12 h-12 text-muted-foreground/30" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 backdrop-blur-sm rounded-full p-3">
                <Play className="w-6 h-6 text-[#9C1E1E]" />
              </div>
            </div>
          </div>
          <div className="p-4">
            <h5 className="font-medium text-sm text-foreground truncate mb-2">
              {video.nome}
            </h5>
            <div className="flex items-center justify-between">
              {getStatusBadge(video.approvalStatus)}
              <span className="text-xs text-muted-foreground">
                {video.duracao}s
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
