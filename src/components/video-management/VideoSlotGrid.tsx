
import React from 'react';
import { VideoSlotCard } from './VideoSlotCard';
import { VideoSlotStatus } from './VideoSlotStatus';
import { useCurrentVideoDisplay } from '@/hooks/useCurrentVideoDisplay';

interface VideoSlot {
  id?: string;
  slot_position: number;
  video_id?: string;
  is_active: boolean;
  selected_for_display: boolean;
  is_base_video: boolean;
  approval_status: 'pending' | 'approved' | 'rejected';
  video_data?: {
    id: string;
    nome: string;
    url: string;
    duracao: number;
    orientacao: string;
    tem_audio: boolean;
    tamanho_arquivo?: number;
    formato?: string;
  };
  rejection_reason?: string;
}

interface VideoSlotGridProps {
  videoSlots: VideoSlot[];
  uploading: boolean;
  uploadProgress: { [key: number]: number };
  onUpload: (slotPosition: number, file: File, title: string, scheduleRules?: any[]) => void;
  onActivate: (slotId: string) => void;
  onRemove: (slotId: string) => void;
  onSelectForDisplay: (slotId: string) => void;
  onDownload?: (videoUrl: string, fileName: string) => void;
  onSetBaseVideo?: (slotId: string) => void;
  onScheduleVideo?: (videoId: string, scheduleRules: any[]) => Promise<void>;
  orderId: string;
}

export const VideoSlotGrid: React.FC<VideoSlotGridProps> = ({
  videoSlots,
  uploading,
  uploadProgress,
  onUpload,
  onActivate,
  onRemove,
  onSelectForDisplay,
  onDownload,
  onSetBaseVideo,
  onScheduleVideo,
  orderId
}) => {
  const { currentVideo } = useCurrentVideoDisplay({ orderId, enabled: true });

  // Contar vídeos aprovados
  const totalApprovedVideos = videoSlots.filter(slot => 
    slot.approval_status === 'approved'
  ).length;
  return (
    <div className="space-y-4">
      <VideoSlotStatus videoSlots={videoSlots} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {videoSlots.map((slot) => (
          <VideoSlotCard
            key={slot.slot_position}
            slot={slot}
            uploading={uploading}
            uploadProgress={uploadProgress}
            onUpload={onUpload}
            onActivate={onActivate}
            onRemove={onRemove}
            onSelectForDisplay={onSelectForDisplay}
            onDownload={onDownload}
            onSetBaseVideo={onSetBaseVideo}
            onScheduleVideo={onScheduleVideo}
            orderId={orderId}
            currentDisplayVideoId={currentVideo?.video_id}
            totalApprovedVideos={totalApprovedVideos}
          />
        ))}
      </div>
    </div>
  );
};
