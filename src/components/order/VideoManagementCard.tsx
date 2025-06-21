
import React from 'react';
import { Video } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VideoSlotGrid } from '@/components/video-management/VideoSlotGrid';
import { VideoSlot } from '@/types/videoManagement';

interface VideoManagementCardProps {
  videoSlots: VideoSlot[];
  uploading: boolean;
  uploadProgress: { [key: number]: number };
  onUpload: (slotPosition: number, file: File, title: string) => Promise<void>;
  onActivate: (slotId: string) => Promise<void>;
  onRemove: (slotId: string) => Promise<void>;
  onSelectForDisplay: (slotId: string) => Promise<void>;
  onDownload: (videoUrl: string, fileName: string) => void;
}

export const VideoManagementCard: React.FC<VideoManagementCardProps> = ({
  videoSlots,
  uploading,
  uploadProgress,
  onUpload,
  onActivate,
  onRemove,
  onSelectForDisplay,
  onDownload
}) => {
  const handleUpload = async (slotPosition: number, file: File, title: string) => {
    await onUpload(slotPosition, file, title);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Video className="h-5 w-5 mr-2" />
          Gestão de Vídeos
        </CardTitle>
        <p className="text-sm text-gray-600">
          Envie até 4 vídeos com títulos descritivos e selecione qual será exibido nos painéis.
        </p>
      </CardHeader>
      <CardContent>
        <VideoSlotGrid
          videoSlots={videoSlots}
          uploading={uploading}
          uploadProgress={uploadProgress}
          onUpload={handleUpload}
          onActivate={onActivate}
          onRemove={onRemove}
          onSelectForDisplay={onSelectForDisplay}
          onDownload={onDownload}
        />
      </CardContent>
    </Card>
  );
};
