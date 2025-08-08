import React from 'react';
import { VideoSlot } from '@/types/videoManagement';
import { VideoWeeklySchedule } from './VideoWeeklySchedule';

interface VideoScheduleManagerProps {
  videoSlots: VideoSlot[];
  onScheduleUpdate: (videoId: string, scheduleRules: any[]) => Promise<void>;
  disabled?: boolean;
}

export const VideoScheduleManager: React.FC<VideoScheduleManagerProps> = ({
  videoSlots,
  onScheduleUpdate,
  disabled = false
}) => {
  // Agora só mostra a playlist semanal - removido botão de editar
  return <VideoWeeklySchedule videoSlots={videoSlots} />;
};