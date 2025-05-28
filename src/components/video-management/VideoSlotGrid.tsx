
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Play, 
  Trash2, 
  Download, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface VideoSlot {
  id?: string;
  slot_position: number;
  video_id?: string;
  is_active: boolean;
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

interface VideoSlotGridProps {
  videoSlots: VideoSlot[];
  uploading: boolean;
  onUpload: (slotPosition: number, file: File) => void;
  onActivate: (slotId: string) => void;
  onRemove: (slotId: string) => void;
  onDownload?: (videoUrl: string, fileName: string) => void;
}

export const VideoSlotGrid: React.FC<VideoSlotGridProps> = ({
  videoSlots,
  uploading,
  onUpload,
  onActivate,
  onRemove,
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

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (isActive) {
      return <Badge className="bg-green-100 text-green-800">ATIVO</Badge>;
    }
    
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejeitado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      default:
        return null;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDuration = (seconds: number) => {
    return `${seconds}s`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {videoSlots.map((slot) => (
        <Card 
          key={slot.slot_position} 
          className={`transition-all duration-200 ${
            slot.is_active 
              ? 'border-2 border-green-500 bg-green-50 shadow-lg' 
              : 'border-gray-200 hover:shadow-md'
          }`}
        >
          <CardContent className="p-6">
            {/* Header do Slot */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-lg">Slot {slot.slot_position}</h3>
                {slot.video_data && getStatusIcon(slot.approval_status)}
              </div>
              {slot.video_data && getStatusBadge(slot.approval_status, slot.is_active)}
            </div>

            {slot.video_data ? (
              <div className="space-y-4">
                {/* Preview do Vídeo */}
                <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center relative overflow-hidden">
                  <Play className="h-12 w-12 text-white opacity-80" />
                  {slot.is_active && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-green-500 text-white">EXIBINDO</Badge>
                    </div>
                  )}
                </div>

                {/* Informações do Vídeo */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm truncate" title={slot.video_data.nome}>
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
                <div className="flex space-x-2">
                  {slot.approval_status === 'approved' && !slot.is_active && (
                    <Button
                      size="sm"
                      onClick={() => slot.id && onActivate(slot.id)}
                      className="bg-green-600 hover:bg-green-700 flex-1"
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Ativar
                    </Button>
                  )}
                  
                  {onDownload && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDownload(slot.video_data!.url, slot.video_data!.nome)}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => slot.id && onRemove(slot.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Remover
                  </Button>
                </div>
              </div>
            ) : (
              /* Upload Area */
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-sm text-gray-600 mb-4">
                  Clique para enviar vídeo ou arraste aqui
                </p>
                <input
                  type="file"
                  accept="video/mp4,video/quicktime,video/avi"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      onUpload(slot.slot_position, file);
                    }
                  }}
                  className="hidden"
                  id={`upload-${slot.slot_position}`}
                  disabled={uploading}
                />
                <label 
                  htmlFor={`upload-${slot.slot_position}`}
                  className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  {uploading ? 'Enviando...' : 'Escolher Arquivo'}
                </label>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
