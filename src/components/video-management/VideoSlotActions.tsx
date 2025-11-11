
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Trash2, 
  Download, 
  Calendar,
  Lock,
  AlertTriangle,
  Check,
  Info
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
import { toast } from 'sonner';
import { VideoScheduleDetailsModal } from './VideoScheduleDetailsModal';
import { SlotVideoScheduleModal } from './SlotVideoScheduleModal';
import { videoLogger } from '@/services/logger/VideoActionLogger';

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
  onSelectForDisplay: (slotId: string) => void;
  onDownload: (videoUrl: string, fileName: string) => void;
  onScheduleVideo?: (videoId: string, scheduleRules: any[]) => Promise<void>;
  totalApprovedVideos: number;
  orderId?: string; // Novo: ID do pedido para o webhook
}

export const VideoSlotActions: React.FC<VideoSlotActionsProps> = ({
  slot,
  onActivate,
  onRemove,
  onSelectForDisplay,
  onDownload,
  onScheduleVideo,
  totalApprovedVideos,
  orderId
}) => {
  const [showApprovalAlert, setShowApprovalAlert] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showSlotScheduleModal, setShowSlotScheduleModal] = useState(false);

  if (!slot.video_data) return null;

  const isApproved = slot.approval_status === 'approved';
  const isPending = slot.approval_status === 'pending';
  const isRejected = slot.approval_status === 'rejected';

  const handleSelectForDisplay = () => {
    // 📘 LOG: Capturar clique do usuário
    videoLogger.logUserClick(slot.id || 'unknown', slot.video_data?.nome || 'unknown', {
      slotPosition: slot.slot_position,
      approvalStatus: slot.approval_status,
      isBaseVideo: slot.is_base_video,
      selectedForDisplay: slot.selected_for_display,
      orderId
    });

    if (!isApproved) {
      videoLogger.log('warn', 'UI_USER_ACTION', 'Video not approved - blocking action', {
        slotId: slot.id,
        approvalStatus: slot.approval_status
      });
      setShowApprovalAlert(true);
      return;
    }
    
    if (slot.id) {
      videoLogger.log('info', 'UI_USER_ACTION', 'Calling onSelectForDisplay', {
        slotId: slot.id,
        videoTitle: slot.video_data?.nome
      });
      onSelectForDisplay(slot.id);
    }
  };

  const getApprovalAlertContent = () => {
    if (isPending) {
      return {
        title: "Vídeo Aguardando Aprovação",
        description: "Este vídeo ainda não foi aprovado pelos administradores. Apenas vídeos aprovados podem ser selecionados para exibição nos painéis.",
        icon: <AlertTriangle className="h-6 w-6 text-yellow-500" />
      };
    }
    
    if (isRejected) {
      return {
        title: "Vídeo Rejeitado",
        description: `Este vídeo foi rejeitado pelos administradores. ${slot.rejection_reason ? `Motivo: ${slot.rejection_reason}` : ''} Apenas vídeos aprovados podem ser selecionados para exibição.`,
        icon: <AlertTriangle className="h-6 w-6 text-red-500" />
      };
    }

    return {
      title: "Vídeo Não Aprovado",
      description: "Apenas vídeos aprovados podem ser selecionados para exibição nos painéis.",
      icon: <Lock className="h-6 w-6 text-gray-500" />
    };
  };

  const alertContent = getApprovalAlertContent();

  const handleScheduleVideo = async (scheduleRules: any[]) => {
    if (onScheduleVideo && slot.video_data?.id) {
      await onScheduleVideo(slot.video_data.id, scheduleRules);
    }
  };

  return (
    <>
      {/* Botões principais com apenas ícones */}
      <div className="flex justify-center gap-2">
        {/* Download - sempre disponível */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDownload(slot.video_data!.url, slot.video_data!.nome)}
          className="border-black text-black hover:bg-black hover:text-white p-2"
          title="Download do vídeo"
        >
          <Download className="h-4 w-4" />
        </Button>

        {/* Exibir nos Painéis - apenas para vídeos aprovados */}
        {isApproved && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectForDisplay}
            className={`${
              slot.selected_for_display 
                ? 'border-green-600 text-green-600 bg-green-50 hover:bg-green-100' 
                : 'border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white'
            } p-2`}
            title={slot.selected_for_display ? "Vídeo em exibição" : "Exibir nos painéis"}
          >
            {slot.selected_for_display ? <Check className="h-4 w-4" /> : <Info className="h-4 w-4" />}
          </Button>
        )}

        {/* Agendar Vídeo - apenas para vídeos aprovados, quando há 2+ vídeos e NÃO é vídeo principal */}
        {isApproved && totalApprovedVideos >= 2 && !slot.is_base_video && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSlotScheduleModal(true)}
            className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white p-2"
            title="Agendar horários de exibição"
          >
            <Calendar className="h-4 w-4" />
          </Button>
        )}
        
        {/* Tooltip quando não pode agendar por ser vídeo principal */}
        {isApproved && slot.is_base_video && (
          <Button
            variant="outline"
            size="sm"
            disabled
            className="border-gray-300 text-gray-400 p-2 cursor-not-allowed"
            title="Vídeos principais não podem ter agendamento"
          >
            <Calendar className="h-4 w-4" />
          </Button>
        )}
        
        {/* Tooltip quando não pode agendar por falta de vídeos */}
        {isApproved && !slot.is_base_video && totalApprovedVideos < 2 && (
          <Button
            variant="outline"
            size="sm"
            disabled
            className="border-gray-300 text-gray-400 p-2 cursor-not-allowed"
            title="Precisa de pelo menos 2 vídeos aprovados para agendar"
          >
            <Calendar className="h-4 w-4" />
          </Button>
        )}
        
        {/* Detalhes */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowScheduleModal(true)}
          className="border-gray-600 text-gray-600 hover:bg-gray-600 hover:text-white p-2"
          title="Ver detalhes do vídeo"
        >
          <Info className="h-4 w-4" />
        </Button>
        
        {/* Remover - verificar se é vídeo base */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => slot.id && onRemove(slot.id)}
          disabled={slot.is_base_video}
          className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white p-2 disabled:opacity-50 disabled:cursor-not-allowed"
          title={slot.is_base_video ? "Não é possível remover o vídeo base" : "Remover vídeo"}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Alert Dialog para vídeos não aprovados */}
      <AlertDialog open={showApprovalAlert} onOpenChange={setShowApprovalAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center space-x-3">
              {alertContent.icon}
              <AlertDialogTitle>{alertContent.title}</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-left">
              {alertContent.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowApprovalAlert(false)}>
              Entendi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
