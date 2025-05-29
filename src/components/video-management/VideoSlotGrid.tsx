
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  Play, 
  Trash2, 
  Download, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertCircle,
  Loader2,
  Star,
  StarOff
} from 'lucide-react';
import { VideoPlayer } from './VideoPlayer';

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

interface VideoSlotGridProps {
  videoSlots: VideoSlot[];
  uploading: boolean;
  uploadProgress: { [key: number]: number };
  onUpload: (slotPosition: number, file: File) => void;
  onActivate: (slotId: string) => void;
  onRemove: (slotId: string) => void;
  onSelectForDisplay: (slotId: string) => void;
  onDownload?: (videoUrl: string, fileName: string) => void;
}

export const VideoSlotGrid: React.FC<VideoSlotGridProps> = ({
  videoSlots,
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

  const hasSelectedVideo = videoSlots.some(slot => slot.video_data && slot.selected_for_display);
  const currentProgress = uploadProgress || {};

  return (
    <div className="space-y-4">
      {/* Alerta se nenhum vídeo está selecionado */}
      {!hasSelectedVideo && videoSlots.some(slot => slot.video_data) && (
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {videoSlots.map((slot) => (
          <Card 
            key={slot.slot_position} 
            className={`transition-all duration-200 ${
              slot.selected_for_display 
                ? 'border-2 border-yellow-400 bg-yellow-50 shadow-lg' 
                : slot.is_active 
                  ? 'border-2 border-green-500 bg-green-50 shadow-lg'
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
              {currentProgress[slot.slot_position] !== undefined && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Enviando vídeo...</span>
                    <span className="text-sm text-gray-500">{Math.round(currentProgress[slot.slot_position])}%</span>
                  </div>
                  <Progress value={currentProgress[slot.slot_position]} className="h-2" />
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
                  <div className="flex flex-col space-y-2">
                    {/* Botão de Seleção para Exibição */}
                    {!slot.selected_for_display && (
                      <Button
                        onClick={() => slot.id && onSelectForDisplay(slot.id)}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white w-full"
                      >
                        <Star className="h-4 w-4 mr-2" />
                        Selecionar para Exibição
                      </Button>
                    )}

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
                        onClick={() => handleDownload(slot.video_data!.url, slot.video_data!.nome)}
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
                </div>
              ) : (
                /* Upload Area */
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-sm text-gray-600 mb-4">
                    Clique para enviar vídeo ou arraste aqui (máx. 15s, horizontal, 100MB)
                  </p>
                  <input
                    type="file"
                    accept="video/mp4,video/quicktime,video/avi,video/mov"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        onUpload(slot.slot_position, file);
                      }
                    }}
                    className="hidden"
                    id={`upload-${slot.slot_position}`}
                    disabled={uploading || currentProgress[slot.slot_position] !== undefined}
                  />
                  <label 
                    htmlFor={`upload-${slot.slot_position}`}
                    className={`cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 ${
                      (uploading || currentProgress[slot.slot_position] !== undefined) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {currentProgress[slot.slot_position] !== undefined ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    {currentProgress[slot.slot_position] !== undefined ? 'Enviando...' : 'Escolher Arquivo'}
                  </label>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
