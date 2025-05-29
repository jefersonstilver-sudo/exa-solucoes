
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Play, 
  Trash2, 
  Download, 
  Star
} from 'lucide-react';

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
  if (!slot.video_data) return null;

  return (
    <div className="flex flex-col space-y-2">
      {/* Botão de Seleção - SEMPRE VISÍVEL para permitir trocar */}
      <Button
        onClick={() => slot.id && onSelectForDisplay(slot.id)}
        className={`w-full ${
          slot.selected_for_display 
            ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
        disabled={!slot.id}
      >
        <Star className="h-4 w-4 mr-2" />
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
  );
};
