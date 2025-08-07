
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Play, 
  Trash2, 
  Download, 
  Star,
  Lock,
  AlertTriangle,
  ArrowRightLeft,
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
}

export const VideoSlotActions: React.FC<VideoSlotActionsProps> = ({
  slot,
  onActivate,
  onRemove,
  onSelectForDisplay,
  onDownload
}) => {
  const [showApprovalAlert, setShowApprovalAlert] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  if (!slot.video_data) return null;

  const isApproved = slot.approval_status === 'approved';
  const isPending = slot.approval_status === 'pending';
  const isRejected = slot.approval_status === 'rejected';

  const handleSelectForDisplay = () => {
    if (!isApproved) {
      setShowApprovalAlert(true);
      return;
    }
    
    if (slot.id) {
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

  return (
    <>
      <div className="flex flex-col space-y-2">
        {/* Status informativo para vídeos aprovados */}
        {isApproved ? (
          <div className="w-full flex items-center justify-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <Check className="h-5 w-5 text-green-600" />
            <span className="font-medium text-green-700">Aprovado e em Exibição</span>
          </div>
        ) : (
          /* Botão de Seleção - Para vídeos não aprovados (desabilitado) */
          <Button
            onClick={handleSelectForDisplay}
            disabled={true}
            className="w-full bg-gray-300 text-gray-500 cursor-not-allowed"
            title={
              isPending 
                ? 'Vídeo aguardando aprovação - não pode ser selecionado'
                : isRejected
                  ? 'Vídeo rejeitado - não pode ser selecionado'
                  : 'Vídeo não aprovado - não pode ser selecionado'
            }
          >
            <Lock className="h-4 w-4 mr-2" />
            Selecionar para Exibição
          </Button>
        )}

        {/* Botões secundários */}
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDownload(slot.video_data!.url, slot.video_data!.nome)}
            className="border-[#00FFAB] text-[#00FFAB] hover:bg-[#00FFAB] hover:text-white"
          >
            <Download className="h-3 w-3 mr-1" />
            Download
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowScheduleModal(true)}
            className="text-blue-600 hover:text-blue-700 border-blue-300 hover:bg-blue-50"
          >
            <Info className="h-3 w-3 mr-1" />
            Detalhes
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => slot.id && onRemove(slot.id)}
            className="text-red-600 hover:text-red-700 border-red-300 hover:bg-red-50"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Remover
          </Button>
        </div>
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
    </>
  );
};
