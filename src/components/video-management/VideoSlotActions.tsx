
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useDebugContext } from '@/contexts/DebugContext';
import { 
  Trash2, 
  Download, 
  Calendar,
  Info,
  AlertTriangle
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { VideoScheduleDetailsModal } from './VideoScheduleDetailsModal';
import { SlotVideoScheduleModal } from './SlotVideoScheduleModal';

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

interface VideoSlotActionsProps {
  slot: VideoSlot;
  onActivate: (slotId: string) => void;
  onRemove: (slotId: string) => void;
  onDownload: (videoUrl: string, fileName: string) => void;
  onScheduleVideo?: (videoId: string, scheduleRules: any[]) => Promise<void>;
  onForceCleanup?: (slotId: string) => Promise<boolean>;
  totalApprovedVideos: number;
  orderId?: string;
}

export const VideoSlotActions: React.FC<VideoSlotActionsProps> = ({
  slot,
  onActivate,
  onRemove,
  onDownload,
  onScheduleVideo,
  onForceCleanup,
  totalApprovedVideos,
  orderId
}) => {
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showSlotScheduleModal, setShowSlotScheduleModal] = useState(false);
  const { forceCleanupEnabled } = useDebugContext();

  if (!slot.video_data) return null;

  const isApproved = slot.approval_status === 'approved';

  const handleScheduleVideo = async (scheduleRules: any[]) => {
    if (onScheduleVideo && slot.video_data?.id) {
      await onScheduleVideo(slot.video_data.id, scheduleRules);
    }
  };

  const handleForceCleanup = async () => {
    if (onForceCleanup && slot.id) {
      const success = await onForceCleanup(slot.id);
      if (success) {
        console.log('✅ Limpeza forçada bem-sucedida');
      }
    }
  };

  // Verificar se o vídeo tem URL corrompida ou inválida
  const hasCorruptedUrl = slot.video_data?.url && (
    slot.video_data.url.includes('undefined') ||
    slot.video_data.url.includes('null') ||
    !slot.video_data.url.startsWith('http')
  );

  return (
    <>
      {/* Botões principais - Layout Responsivo */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-2">
        {/* Download */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDownload(slot.video_data!.url, slot.video_data!.nome)}
          className="border-foreground/20 text-foreground hover:bg-foreground hover:text-background p-2.5 sm:p-2 h-10 w-10 sm:h-8 sm:w-auto rounded-xl sm:rounded-md"
          title="Download do vídeo"
        >
          <Download className="h-4 w-4 sm:h-4 sm:w-4" />
        </Button>

        {/* Agendar Vídeo */}
        {isApproved && totalApprovedVideos >= 2 && !slot.is_base_video && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSlotScheduleModal(true)}
            className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white p-2.5 sm:p-2 h-10 w-10 sm:h-8 sm:w-auto rounded-xl sm:rounded-md"
            title="Agendar horários de exibição"
          >
            <Calendar className="h-4 w-4 sm:h-4 sm:w-4" />
          </Button>
        )}
        
        {isApproved && slot.is_base_video && (
          <Button
            variant="outline"
            size="sm"
            disabled
            className="border-muted-foreground/20 text-muted-foreground p-2.5 sm:p-2 h-10 w-10 sm:h-8 sm:w-auto cursor-not-allowed rounded-xl sm:rounded-md"
            title="Vídeos principais não podem ter agendamento"
          >
            <Calendar className="h-4 w-4 sm:h-4 sm:w-4" />
          </Button>
        )}
        
        {isApproved && !slot.is_base_video && totalApprovedVideos < 2 && (
          <Button
            variant="outline"
            size="sm"
            disabled
            className="border-muted-foreground/20 text-muted-foreground p-2.5 sm:p-2 h-10 w-10 sm:h-8 sm:w-auto cursor-not-allowed rounded-xl sm:rounded-md"
            title="Precisa de pelo menos 2 vídeos aprovados para agendar"
          >
            <Calendar className="h-4 w-4 sm:h-4 sm:w-4" />
          </Button>
        )}
        
        {/* Detalhes */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowScheduleModal(true)}
          className="border-foreground/20 text-muted-foreground hover:bg-muted-foreground hover:text-background p-2.5 sm:p-2 h-10 w-10 sm:h-8 sm:w-auto rounded-xl sm:rounded-md"
          title="Ver detalhes do vídeo"
        >
          <Info className="h-4 w-4 sm:h-4 sm:w-4" />
        </Button>
        
        {/* Remover */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => slot.id && onRemove(slot.id)}
          disabled={slot.is_base_video && slot.approval_status !== 'rejected'}
          className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white p-2.5 sm:p-2 h-10 w-10 sm:h-8 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed rounded-xl sm:rounded-md"
          title={slot.is_base_video && slot.approval_status !== 'rejected' ? "Não é possível remover o vídeo base" : "Remover vídeo"}
        >
          <Trash2 className="h-4 w-4 sm:h-4 sm:w-4" />
        </Button>

        {forceCleanupEnabled && (onForceCleanup || hasCorruptedUrl) && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleForceCleanup}
            className="border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white p-2.5 sm:p-2 h-10 w-10 sm:h-8 sm:w-auto rounded-xl sm:rounded-md"
            title="⚠️ Limpeza Forçada"
          >
            <AlertTriangle className="h-4 w-4 sm:h-4 sm:w-4" />
          </Button>
        )}
      </div>

      {/* Modal de Detalhes da Programação */}
      <VideoScheduleDetailsModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        videoName={slot.video_data?.nome || 'Vídeo sem nome'}
        scheduleRules={slot.schedule_rules}
      />

      {/* Modal de Agendamento Individual do Slot */}
      {slot.video_data && (
        <SlotVideoScheduleModal
          isOpen={showSlotScheduleModal}
          onClose={() => setShowSlotScheduleModal(false)}
          videoName={slot.video_data.nome}
          videoId={slot.video_data.id}
          onSave={handleScheduleVideo}
          existingRules={slot.schedule_rules}
          orderId={orderId}
        />
      )}
    </>
  );
};
