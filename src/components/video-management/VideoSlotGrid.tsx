
import React from 'react';
import { VideoSlotCard } from './VideoSlotCard';
import { VideoSlotStatus } from './VideoSlotStatus';
import { VideoScheduleDebugPanel } from './VideoScheduleDebugPanel';
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
  schedule_rules?: {
    id: string;
    days_of_week: number[];
    start_time: string;
    end_time: string;
    is_active: boolean;
  }[];
}

interface VideoSlotGridProps {
  videoSlots: VideoSlot[];
  uploading: boolean;
  uploadProgress: { [key: number]: number };
  onUpload: (slotPosition: number, file: File, title: string, scheduleRules?: any[]) => void;
  onActivate: (slotId: string) => void;
  onRemove: (slotId: string) => void;
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
  onDownload,
  onSetBaseVideo,
  onScheduleVideo,
  orderId
}) => {
  const { currentVideo } = useCurrentVideoDisplay({ orderId, enabled: true });

  // Log para debug do re-render
  console.log('🔄 [GRID] VideoSlotGrid renderizando:', {
    orderId,
    totalSlots: videoSlots.length,
    slotsWithSelection: videoSlots.map(slot => ({
      position: slot.slot_position,
      hasVideo: !!slot.video_data,
      videoName: slot.video_data?.nome,
      selectedForDisplay: slot.selected_for_display,
      slotId: slot.id
    }))
  });

  // Contar vídeos aprovados
  const totalApprovedVideos = videoSlots.filter(slot => 
    slot.approval_status === 'approved'
  ).length;

  // Verificar se há algum vídeo agendado ativo AGORA (em qualquer slot)
  const hasAnyScheduledActiveNow = videoSlots.some(slot => {
    if (!slot.schedule_rules || slot.schedule_rules.length === 0) return false;
    
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    
    return slot.schedule_rules.some(rule => {
      if (!rule.is_active) return false;
      
      // Verificar se hoje está nos dias programados
      const isDayMatched = rule.days_of_week.includes(currentDay);
      
      // Verificar se está no horário programado
      const isTimeMatched = currentTime >= rule.start_time && currentTime <= rule.end_time;
      
      return isDayMatched && isTimeMatched;
    });
  });

  console.log('🔍 [GRID] Status de agendamento:', {
    hasAnyScheduledActiveNow,
    currentTime: new Date().toTimeString().slice(0, 5),
    currentDay: new Date().getDay()
  });
  return (
    <div className="space-y-4">
      <VideoSlotStatus videoSlots={videoSlots} />
      
      {/* Painel de Debug de Agendamento */}
      <VideoScheduleDebugPanel orderId={orderId} />

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
            onDownload={onDownload}
            onSetBaseVideo={onSetBaseVideo}
            onScheduleVideo={onScheduleVideo}
            orderId={orderId}
            currentDisplayVideoId={currentVideo?.video_id}
            totalApprovedVideos={totalApprovedVideos}
            hasAnyScheduledActiveNow={hasAnyScheduledActiveNow}
          />
        ))}
      </div>
    </div>
  );
};
