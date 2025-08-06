
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Star,
  StarOff,
  CheckCircle, 
  XCircle, 
  Clock,
  AlertCircle,
  Lock,
  Shield
} from 'lucide-react';
import { VideoPlayer } from './VideoPlayer';
import { VideoSlotActions } from './VideoSlotActions';
import { VideoSlotUpload } from './VideoSlotUpload';

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
  onUpload: (slotPosition: number, file: File, title: string, scheduleRules?: any[]) => void;
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
      return <Badge className="bg-green-100 text-green-800 flex items-center space-x-1">
        <Shield className="h-3 w-3" />
        <span>Aprovado</span>
      </Badge>;
    }
    
    if (slot.approval_status === 'rejected') {
      return <Badge className="bg-red-100 text-red-800 flex items-center space-x-1">
        <XCircle className="h-3 w-3" />
        <span>Rejeitado</span>
      </Badge>;
    }
    
    if (slot.approval_status === 'pending') {
      return <Badge className="bg-yellow-100 text-yellow-800 flex items-center space-x-1">
        <Clock className="h-3 w-3" />
        <span>Pendente</span>
      </Badge>;
    }
    
    return null;
  };

  const getSelectionIcon = (slot: VideoSlot) => {
    if (slot.approval_status !== 'approved') {
      return <Lock className="h-5 w-5 text-gray-400" />;
    }
    
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

  const currentProgress = uploadProgress[slot.slot_position];

  // Determinar se o card deve ter visual de bloqueio
  const isBlocked = slot.video_data && slot.approval_status !== 'approved';
  const cardClasses = `transition-all duration-200 bg-white border ${
    slot.selected_for_display 
      ? 'border-2 border-yellow-400 bg-yellow-50 shadow-lg' 
      : slot.is_active 
        ? 'border-2 border-green-500 bg-green-50 shadow-lg'
        : isBlocked
          ? 'border-2 border-gray-300 bg-gray-50 opacity-75'
          : 'border-gray-200 hover:shadow-md'
  }`;

  return (
    <Card className={cardClasses}>
      <CardContent className="p-6">
        {/* Header do Slot */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-lg text-gray-900">Slot {slot.slot_position}</h3>
            {slot.video_data && getStatusIcon(slot.approval_status)}
            {slot.video_data && getSelectionIcon(slot)}
            {isBlocked && (
              <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                Não Selecionável
              </span>
            )}
          </div>
          {slot.video_data && getStatusBadge(slot)}
        </div>

        {/* Progress Bar para Upload */}
        {currentProgress !== undefined && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900">Enviando vídeo...</span>
              <span className="text-sm text-gray-600">{Math.round(currentProgress)}%</span>
            </div>
            <Progress value={currentProgress} className="h-2" />
          </div>
        )}

        {slot.video_data ? (
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
            <div className="space-y-2">
              <h4 className="font-medium text-sm truncate text-gray-900" title={slot.video_data.nome}>
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
        ) : (
          <VideoSlotUpload
            slotPosition={slot.slot_position}
            uploading={uploading}
            isUploading={currentProgress !== undefined}
            onUpload={onUpload}
          />
        )}
      </CardContent>
    </Card>
  );
};
