
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VideoSlot } from '@/types/videoManagement';
import { 
  Play, 
  Star, 
  StarOff, 
  Trash2, 
  CheckCircle, 
  Clock, 
  XCircle,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { isValidVideoUrl } from '@/services/videoStorageService';

interface VideoListItemProps {
  slot: VideoSlot;
  isSelected: boolean;
  onSelect: () => void;
  onSelectForDisplay: () => void;
  onRemove: () => void;
}

export const VideoListItem: React.FC<VideoListItemProps> = ({
  slot,
  isSelected,
  onSelect,
  onSelectForDisplay,
  onRemove
}) => {
  if (!slot.video_data) return null;

  const { video_data } = slot;
  const hasValidUrl = isValidVideoUrl(video_data.url);

  const getStatusIcon = () => {
    if (!hasValidUrl) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    
    switch (slot.approval_status) {
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

  const getStatusBadge = () => {
    if (!hasValidUrl) {
      return <Badge variant="destructive" className="text-xs">Erro</Badge>;
    }

    if (slot.selected_for_display) {
      return <Badge className="bg-green-500 text-white text-xs">SELECIONADO</Badge>;
    }

    switch (slot.approval_status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 text-xs">Aprovado</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 text-xs">Rejeitado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Pendente</Badge>;
      default:
        return null;
    }
  };

  const formatDuration = (seconds: number) => `${seconds}s`;
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div
      className={cn(
        "border rounded-lg p-3 transition-all cursor-pointer",
        isSelected ? "border-indexa-purple bg-purple-50" : "border-gray-200 hover:border-gray-300",
        slot.selected_for_display && "border-green-500 bg-green-50",
        !hasValidUrl && "border-red-300 bg-red-50"
      )}
      onClick={onSelect}
    >
      <div className="flex items-start space-x-3">
        {/* Thumbnail/Icon */}
        <div className="flex-shrink-0">
          <div className="w-12 h-8 bg-gray-200 rounded flex items-center justify-center">
            <Play className="h-4 w-4 text-gray-500" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {video_data.nome}
            </h4>
            {getStatusIcon()}
          </div>
          
          <div className="flex items-center space-x-2 text-xs text-gray-500 mb-2">
            <span>{formatDuration(video_data.duracao)}</span>
            <span>•</span>
            <span>{video_data.orientacao}</span>
            <span>•</span>
            <span>{formatFileSize(video_data.tamanho_arquivo)}</span>
          </div>

          <div className="flex items-center justify-between">
            {getStatusBadge()}
            
            <div className="flex items-center space-x-1">
              {/* Botão de seleção para exibição */}
              {hasValidUrl && slot.approval_status === 'approved' && (
                <Button
                  size="sm"
                  variant={slot.selected_for_display ? "default" : "outline"}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectForDisplay();
                  }}
                  className="h-6 px-2"
                >
                  {slot.selected_for_display ? (
                    <Star className="h-3 w-3 fill-current" />
                  ) : (
                    <StarOff className="h-3 w-3" />
                  )}
                </Button>
              )}
              
              {/* Botão de remover */}
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="h-6 px-2 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Motivo de rejeição */}
          {slot.approval_status === 'rejected' && slot.rejection_reason && (
            <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
              <strong>Rejeitado:</strong> {slot.rejection_reason}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
