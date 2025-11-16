
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, RefreshCw, Trash2 } from 'lucide-react';
import { cleanupPendingUploads } from '@/services/videoStorageService';
import { useAuth } from '@/hooks/useAuth';
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

interface VideoSlotStatusProps {
  videoSlots: VideoSlot[];
  onRefresh?: () => void;
}

export const VideoSlotStatus: React.FC<VideoSlotStatusProps> = ({ 
  videoSlots, 
  onRefresh 
}) => {
  const { userProfile } = useAuth();
  const [isCleaningUp, setIsCleaningUp] = React.useState(false);

  const totalSlots = 4;
  const filledSlots = videoSlots.filter(slot => slot.video_data).length;
  const selectedSlot = videoSlots.find(slot => slot.selected_for_display);
  const approvedSlot = videoSlots.find(slot => 
    slot.approval_status === 'approved' && slot.selected_for_display
  );

  // Verificar se há vídeos com problemas (URLs pending_upload)
  const problemVideos = videoSlots.filter(slot => 
    slot.video_data && slot.video_data.url === 'pending_upload'
  );

  const handleCleanupOrphans = async () => {
    if (!userProfile?.id) {
      toast.error('Usuário não autenticado');
      return;
    }

    try {
      setIsCleaningUp(true);
      console.log('🧹 Iniciando limpeza de registros órfãos...');
      
      const cleanedCount = await cleanupPendingUploads(userProfile.id);
      
      if (cleanedCount > 0) {
        toast.success(`${cleanedCount} registro(s) órfão(s) removido(s)`);
        if (onRefresh) {
          onRefresh();
        }
      } else {
        toast.info('Nenhum registro órfão encontrado');
      }
    } catch (error) {
      console.error('❌ Erro na limpeza:', error);
      toast.error('Erro ao limpar registros órfãos');
    } finally {
      setIsCleaningUp(false);
    }
  };

  return (
    <div className="space-y-4">

      {/* Problem Detection */}
      {problemVideos.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-red-800">
                Problemas Detectados ({problemVideos.length} vídeo{problemVideos.length > 1 ? 's' : ''})
              </h4>
              <p className="text-sm text-red-700 mt-1">
                Alguns vídeos não foram enviados corretamente e possuem URLs pendentes. 
                Isso pode acontecer quando o upload é interrompido.
              </p>
              <div className="flex space-x-2 mt-3">
                <Button
                  onClick={handleCleanupOrphans}
                  disabled={isCleaningUp}
                  size="sm"
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  {isCleaningUp ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  {isCleaningUp ? 'Limpando...' : 'Limpar Registros Órfãos'}
                </Button>
                {onRefresh && (
                  <Button
                    onClick={onRefresh}
                    size="sm"
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-100"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Atualizar Lista
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
