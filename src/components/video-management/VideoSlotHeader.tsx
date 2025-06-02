
import React from 'react';
import { Badge } from '@/components/ui/badge';
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

interface VideoSlotHeaderProps {
  slot: VideoSlot;
  isBlocked: boolean;
}

export const VideoSlotHeader: React.FC<VideoSlotHeaderProps> = ({ slot, isBlocked }) => {
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

  return (
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
  );
};
