
import React from 'react';
import { 
  AlertCircle,
  Star,
  RefreshCw
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

interface VideoSlotStatusProps {
  videoSlots: VideoSlot[];
}

export const VideoSlotStatus: React.FC<VideoSlotStatusProps> = ({ videoSlots }) => {
  const hasSelectedVideo = videoSlots.some(slot => slot.video_data && slot.selected_for_display);
  const videosWithData = videoSlots.filter(slot => slot.video_data);

  return (
    <div className="space-y-4">
      {/* Alerta se nenhum vídeo está selecionado */}
      {!hasSelectedVideo && videosWithData.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <div>
              <h3 className="font-medium text-red-800">Nenhum vídeo selecionado para exibição</h3>
              <p className="text-red-600 text-sm mt-1">
                Você deve selecionar qual vídeo será exibido nos painéis. Clique no botão "Selecionar para Exibição" em um dos seus vídeos.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Status da seleção atual */}
      {hasSelectedVideo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Star className="h-5 w-5 text-blue-500 mr-2 fill-current" />
              <div>
                <h3 className="font-medium text-blue-800">Vídeo Selecionado</h3>
                <p className="text-blue-600 text-sm">
                  {videosWithData.find(slot => slot.selected_for_display)?.video_data?.nome || 'Vídeo selecionado'}
                </p>
              </div>
            </div>
            <RefreshCw className="h-4 w-4 text-blue-500" />
          </div>
        </div>
      )}
    </div>
  );
};
