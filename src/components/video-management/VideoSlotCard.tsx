
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Star,
  StarOff,
  CheckCircle, 
  XCircle, 
  Clock,
  AlertCircle,
  Upload,
  RefreshCw
} from 'lucide-react';
import { VideoPlayer } from './VideoPlayer';
import { VideoSlotActions } from './VideoSlotActions';
import { VideoSlotUpload } from './VideoSlotUpload';
import { isValidVideoUrl } from '@/services/videoStorageService';

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

interface VideoSlotCardProps {
  slot: VideoSlot;
  uploading: boolean;
  uploadProgress: { [key: number]: number };
  onUpload: (slotPosition: number, file: File) => void;
  onActivate: (slotId: string) => void;
  onRemove: (slotId: string) => void;
  onSelectForDisplay: (slotId: string) => void;
  onDownload?: (videoUrl: string, fileName: string) => void;
}

export const VideoSlotCard: React.FC<VideoSlotCardProps> = ({
  slot,
  uploading,
  uploadProgress,
  onUpload,
  onActivate,
  onRemove,
  onSelectForDisplay,
  onDownload
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (slot: VideoSlot) => {
    if (slot.selected_for_display && slot.approval_status === 'approved' && slot.is_active) {
      return <Badge className="bg-green-500 text-white">EXIBINDO AGORA</Badge>;
    }
    
    if (slot.selected_for_display && slot.approval_status === 'approved') {
      return <Badge className="bg-blue-500 text-white">APROVADO - SELECIONADO</Badge>;
    }
    
    if (slot.selected_for_display && slot.approval_status === 'pending') {
      return <Badge className="bg-orange-500 text-white">SELECIONADO - AGUARDANDO APROVAÇÃO</Badge>;
    }
    
    if (slot.selected_for_display && slot.approval_status === 'rejected') {
      return <Badge className="bg-red-500 text-white">SELECIONADO - REJEITADO</Badge>;
    }
    
    if (slot.approval_status === 'approved') {
      return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>;
    }
    
    if (slot.approval_status === 'rejected') {
      return <Badge className="bg-red-100 text-red-800">Rejeitado</Badge>;
    }
    
    if (slot.approval_status === 'pending') {
      return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
    }
    
    return null;
  };

  const getSelectionIcon = (slot: VideoSlot) => {
    if (slot.selected_for_display) {
      return <Star className="h-5 w-5 text-yellow-500 fill-current" />;
    }
    return <StarOff className="h-5 w-5 text-gray-400" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDuration = (seconds: number) => {
    return `${seconds}s`;
  };

  const handleDownload = (videoUrl: string, fileName: string) => {
    if (onDownload) {
      onDownload(videoUrl, fileName);
    } else {
      window.open(videoUrl, '_blank');
    }
  };

  const handleReUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/mp4,video/quicktime,video/avi,video/mov';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        onUpload(slot.slot_position, file);
      }
    };
    input.click();
  };

  const currentProgress = uploadProgress[slot.slot_position];
  const hasInvalidUrl = slot.video_data && !isValidVideoUrl(slot.video_data.url);

  return (
    <Card 
      className={`transition-all duration-200 ${
        slot.selected_for_display 
          ? 'border-2 border-yellow-400 bg-yellow-50 shadow-lg' 
          : slot.is_active 
            ? 'border-2 border-green-500 bg-green-50 shadow-lg'
            : hasInvalidUrl
              ? 'border-2 border-red-400 bg-red-50 shadow-lg'
              : 'border-gray-200 hover:shadow-md'
      }`}
    >
      <CardContent className="p-6">
        {/* Header do Slot */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-lg text-black">Slot {slot.slot_position}</h3>
            {slot.video_data && getStatusIcon(slot.approval_status)}
            {slot.video_data && getSelectionIcon(slot)}
          </div>
          {slot.video_data && getStatusBadge(slot)}
        </div>

        {/* Progress Bar para Upload */}
        {currentProgress !== undefined && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Enviando vídeo...</span>
              <span className="text-sm text-gray-500">{Math.round(currentProgress)}%</span>
            </div>
            <Progress value={currentProgress} className="h-2" />
          </div>
        )}

        {/* URL Inválida - Mostrar erro e opção de re-upload */}
        {hasInvalidUrl && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="font-medium text-red-800">Erro no Upload</span>
            </div>
            <p className="text-red-600 text-sm mb-3">
              O upload do vídeo não foi concluído corretamente. Clique no botão abaixo para tentar novamente.
            </p>
            <Button
              onClick={handleReUpload}
              className="bg-red-600 hover:bg-red-700 text-white w-full"
              disabled={uploading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Fazer Upload Novamente
            </Button>
          </div>
        )}

        {slot.video_data && !hasInvalidUrl ? (
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
            </div>

            {/* Informações do Vídeo */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm truncate text-black" title={slot.video_data.nome}>
                {slot.video_data.nome}
              </h4>
              <div className="flex justify-between text-xs text-gray-600">
                <span>{formatDuration(slot.video_data.duracao)}</span>
                <span>{slot.video_data.orientacao}</span>
                <span>{formatFileSize(slot.video_data.tamanho_arquivo)}</span>
              </div>
            </div>

            {/* Motivo de Rejeição */}
            {slot.approval_status === 'rejected' && slot.rejection_reason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">
                  <strong>Motivo da rejeição:</strong> {slot.rejection_reason}
                </p>
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
        ) : !hasInvalidUrl ? (
          <VideoSlotUpload
            slotPosition={slot.slot_position}
            uploading={uploading}
            isUploading={currentProgress !== undefined}
            onUpload={onUpload}
          />
        ) : null}
      </CardContent>
    </Card>
  );
};
