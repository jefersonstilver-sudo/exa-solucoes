
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { VideoSlotHeader } from './VideoSlotHeader';
import { VideoSlotContent } from './VideoSlotContent';
import { VideoSlotUpload } from './VideoSlotUpload';

interface VideoSlot {
  id?: string;
  slot_position: number;
  video_id?: string;
  is_active: boolean;
  selected_for_display: boolean;
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

interface VideoSlotCardProps {
  slot: VideoSlot;
  uploading: boolean;
  uploadProgress: { [key: number]: number };
  onUpload: (slotPosition: number, file: File) => void;
  onActivate: (slotId: string) => void;
  onRemove: (slotId: string) => void;
  onSelectForDisplay: (slotId: string) => void;
  onDownload?: (videoUrl: string, fileName: string) => void;
}

export const VideoSlotCard: React.FC<VideoSlotCardProps> = ({
  slot,
  uploading,
  uploadProgress,
  onUpload,
  onActivate,
  onRemove,
  onSelectForDisplay,
  onDownload
}) => {
  const handleDownload = (videoUrl: string, fileName: string) => {
    if (onDownload) {
      onDownload(videoUrl, fileName);
    } else {
      window.open(videoUrl, '_blank');
    }
  };

  const currentProgress = uploadProgress[slot.slot_position];

  // Determinar se o card deve ter visual de bloqueio
  const isBlocked = slot.video_data && slot.approval_status !== 'approved';
  const cardClasses = `transition-all duration-200 bg-white border ${
    slot.selected_for_display 
      ? 'border-2 border-yellow-400 bg-yellow-50 shadow-lg' 
      : slot.is_active 
        ? 'border-2 border-green-500 bg-green-50 shadow-lg'
        : isBlocked
          ? 'border-2 border-gray-300 bg-gray-50 opacity-75'
          : 'border-gray-200 hover:shadow-md'
  }`;

  return (
    <Card className={cardClasses}>
      <CardContent className="p-6">
        {/* Header do Slot */}
        <VideoSlotHeader slot={slot} isBlocked={isBlocked} />

        {/* Progress Bar para Upload */}
        {currentProgress !== undefined && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900">Enviando vídeo...</span>
              <span className="text-sm text-gray-600">{Math.round(currentProgress)}%</span>
            </div>
            <Progress value={currentProgress} className="h-2" />
          </div>
        )}

        {slot.video_data ? (
          <VideoSlotContent
            slot={slot}
            isBlocked={isBlocked}
            onActivate={onActivate}
            onRemove={onRemove}
            onSelectForDisplay={onSelectForDisplay}
            onDownload={handleDownload}
          />
        ) : (
          <VideoSlotUpload
            slotPosition={slot.slot_position}
            uploading={uploading}
            isUploading={currentProgress !== undefined}
            onUpload={onUpload}
          />
        )}
      </CardContent>
    </Card>
  );
};
