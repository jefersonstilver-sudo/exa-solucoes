
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
      <div className="flex flex-wrap justify-center gap-0.5 sm:gap-2">
        {/* Download - sempre disponível */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDownload(slot.video_data!.url, slot.video_data!.nome)}
          className="border-black text-black hover:bg-black hover:text-white p-1 sm:p-2 h-6 sm:h-8"
          title="Download do vídeo"
        >
          <Download className="h-2.5 w-2.5 sm:h-4 sm:w-4" />
        </Button>

        {/* Agendar Vídeo - apenas para vídeos aprovados, quando há 2+ vídeos e NÃO é vídeo principal */}
        {isApproved && totalApprovedVideos >= 2 && !slot.is_base_video && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSlotScheduleModal(true)}
            className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white p-1 sm:p-2 h-6 sm:h-8"
            title="Agendar horários de exibição"
          >
            <Calendar className="h-2.5 w-2.5 sm:h-4 sm:w-4" />
          </Button>
        )}
        
        {/* Tooltip quando não pode agendar por ser vídeo principal */}
        {isApproved && slot.is_base_video && (
          <Button
            variant="outline"
            size="sm"
            disabled
            className="border-gray-300 text-gray-400 p-1 sm:p-2 h-6 sm:h-8 cursor-not-allowed"
            title="Vídeos principais não podem ter agendamento"
          >
            <Calendar className="h-2.5 w-2.5 sm:h-4 sm:w-4" />
          </Button>
        )}
        
        {/* Tooltip quando não pode agendar por falta de vídeos */}
        {isApproved && !slot.is_base_video && totalApprovedVideos < 2 && (
          <Button
            variant="outline"
            size="sm"
            disabled
            className="border-gray-300 text-gray-400 p-1 sm:p-2 h-6 sm:h-8 cursor-not-allowed"
            title="Precisa de pelo menos 2 vídeos aprovados para agendar"
          >
            <Calendar className="h-2.5 w-2.5 sm:h-4 sm:w-4" />
          </Button>
        )}
        
        {/* Detalhes */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowScheduleModal(true)}
          className="border-gray-600 text-gray-600 hover:bg-gray-600 hover:text-white p-1 sm:p-2 h-6 sm:h-8"
          title="Ver detalhes do vídeo"
        >
          <Info className="h-2.5 w-2.5 sm:h-4 sm:w-4" />
        </Button>
        
        {/* Remover - verificar se é vídeo base */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => slot.id && onRemove(slot.id)}
          disabled={slot.is_base_video}
          className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white p-1 sm:p-2 h-6 sm:h-8 disabled:opacity-50 disabled:cursor-not-allowed"
          title={slot.is_base_video ? "Não é possível remover o vídeo base" : "Remover vídeo"}
        >
          <Trash2 className="h-2.5 w-2.5 sm:h-4 sm:w-4" />
        </Button>

        {/* Limpeza Forçada - apenas se Force Cleanup estiver ativado no debug E (tiver onForceCleanup OU URL corrompida) */}
        {forceCleanupEnabled && (onForceCleanup || hasCorruptedUrl) && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleForceCleanup}
            className="border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white p-1 sm:p-2 h-6 sm:h-8"
            title="⚠️ Limpeza Forçada - Remove vídeo corrompido bypassing validações (Ativado via Debug Mode)"
          >
            <AlertTriangle className="h-2.5 w-2.5 sm:h-4 sm:w-4" />
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
