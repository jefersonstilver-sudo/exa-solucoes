
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Star, Lock } from 'lucide-react';
import { VideoPlayer } from './VideoPlayer';
import { VideoSlotActions } from './VideoSlotActions';
import { VideoSlotInfo } from './VideoSlotInfo';

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

interface VideoSlotContentProps {
  slot: VideoSlot;
  isBlocked: boolean;
  onActivate: (slotId: string) => void;
  onRemove: (slotId: string) => void;
  onSelectForDisplay: (slotId: string) => void;
  onDownload: (videoUrl: string, fileName: string) => void;
}

export const VideoSlotContent: React.FC<VideoSlotContentProps> = ({
  slot,
  isBlocked,
  onActivate,
  onRemove,
  onSelectForDisplay,
  onDownload
}) => {
  if (!slot.video_data) return null;

  const handleDownload = (videoUrl: string, fileName: string) => {
    onDownload(videoUrl, fileName);
  };

  return (
    <div className="space-y-4">
      {/* Video Player */}
      <div className="aspect-video rounded-lg overflow-hidden relative">
        <VideoPlayer
          src={slot.video_data.url}
          title={slot.video_data.nome}
          className="w-full h-full"
          muted={true}
          controls={true}
          onDownload={() => handleDownload(slot.video_data!.url, slot.video_data!.nome)}
        />
        {slot.selected_for_display && (
          <div className="absolute top-2 left-2 z-10">
            <Badge className="bg-yellow-500 text-white flex items-center space-x-1">
              <Star className="h-3 w-3 fill-current" />
              <span>SELECIONADO</span>
            </Badge>
          </div>
        )}
        {isBlocked && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
            <div className="text-center text-white">
              <Lock className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">Aguardando Aprovação</p>
            </div>
          </div>
        )}
      </div>

      {/* Informações do Vídeo */}
      <VideoSlotInfo videoData={slot.video_data} />

      {/* Motivo de Rejeição */}
      {slot.approval_status === 'rejected' && slot.rejection_reason && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-800 text-sm">
            <strong>Motivo da rejeição:</strong> {slot.rejection_reason}
          </p>
        </div>
      )}

      {/* Aviso para vídeos não aprovados */}
      {isBlocked && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <Lock className="h-4 w-4 text-gray-500" />
            <p className="text-gray-700 text-sm">
              {slot.approval_status === 'pending' 
                ? 'Este vídeo está aguardando aprovação dos administradores.'
                : 'Este vídeo foi rejeitado e não pode ser selecionado.'
              }
            </p>
          </div>
        </div>
      )}

      {/* Botões de Ação */}
      <VideoSlotActions
        slot={slot}
        onActivate={onActivate}
        onRemove={onRemove}
        onSelectForDisplay={onSelectForDisplay}
        onDownload={handleDownload}
      />
    </div>
  );
};
