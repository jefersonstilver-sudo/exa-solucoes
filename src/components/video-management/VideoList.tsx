
import React from 'react';
import { VideoSlot } from '@/types/videoManagement';
import { VideoListItem } from './VideoListItem';

interface VideoListProps {
  videoSlots: VideoSlot[];
  onVideoSelect: (slot: VideoSlot) => void;
  onSelectForDisplay: (slotId: string) => void;
  onRemove: (slotId: string) => void;
  selectedVideoUrl: string;
}

export const VideoList: React.FC<VideoListProps> = ({
  videoSlots,
  onVideoSelect,
  onSelectForDisplay,
  onRemove,
  selectedVideoUrl
}) => {
  if (videoSlots.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">
          Nenhum vídeo enviado ainda.
        </p>
        <p className="text-sm text-gray-400 mt-1">
          Use a área de upload acima para enviar seus vídeos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {videoSlots.map((slot) => (
        <VideoListItem
          key={slot.id || slot.slot_position}
          slot={slot}
          isSelected={slot.video_data?.url === selectedVideoUrl}
          onSelect={() => onVideoSelect(slot)}
          onSelectForDisplay={() => slot.id && onSelectForDisplay(slot.id)}
          onRemove={() => slot.id && onRemove(slot.id)}
        />
      ))}
    </div>
  );
};
