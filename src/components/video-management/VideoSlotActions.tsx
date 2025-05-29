
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Play, 
  Trash2, 
  Download, 
  Star,
  Lock,
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
import { toast } from 'sonner';

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
        {/* Botão de Seleção - Com validação de aprovação */}
        <Button
          onClick={handleSelectForDisplay}
          disabled={!isApproved}
          className={`w-full ${
            slot.selected_for_display 
              ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
              : isApproved
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          title={
            !isApproved 
              ? isPending 
                ? 'Vídeo aguardando aprovação - não pode ser selecionado'
                : isRejected
                  ? 'Vídeo rejeitado - não pode ser selecionado'
                  : 'Vídeo não aprovado - não pode ser selecionado'
              : slot.selected_for_display 
                ? 'Este vídeo está selecionado para exibição'
                : 'Selecionar este vídeo para exibição nos painéis'
          }
        >
          {!isApproved && <Lock className="h-4 w-4 mr-2" />}
          {isApproved && <Star className="h-4 w-4 mr-2" />}
          {slot.selected_for_display ? 'SELECIONADO ✓' : 'Selecionar para Exibição'}
        </Button>

        {/* Botões secundários */}
        <div className="flex space-x-2">
          {slot.approval_status === 'approved' && !slot.is_active && slot.selected_for_display && (
            <Button
              size="sm"
              onClick={() => slot.id && onActivate(slot.id)}
              className="bg-green-600 hover:bg-green-700 flex-1"
            >
              <Play className="h-3 w-3 mr-1" />
              Ativar
            </Button>
          )}
          
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
    </>
  );
};
