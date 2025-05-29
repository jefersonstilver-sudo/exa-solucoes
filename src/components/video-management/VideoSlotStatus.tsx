
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
      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="font-medium text-blue-800">Slots Preenchidos</span>
          </div>
          <p className="text-2xl font-bold text-blue-900 mt-1">
            {filledSlots}/{totalSlots}
          </p>
        </div>

        <div className={`border rounded-lg p-4 ${
          selectedSlot 
            ? 'bg-green-50 border-green-200' 
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center space-x-2">
            {selectedSlot ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
            )}
            <span className={`font-medium ${
              selectedSlot ? 'text-green-800' : 'text-yellow-800'
            }`}>
              Vídeo Selecionado
            </span>
          </div>
          <p className={`text-sm mt-1 ${
            selectedSlot ? 'text-green-700' : 'text-yellow-700'
          }`}>
            {selectedSlot ? 'Slot ' + selectedSlot.slot_position : 'Nenhum selecionado'}
          </p>
        </div>

        <div className={`border rounded-lg p-4 ${
          approvedSlot 
            ? 'bg-green-50 border-green-200' 
            : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center space-x-2">
            {approvedSlot ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-gray-500" />
            )}
            <span className={`font-medium ${
              approvedSlot ? 'text-green-800' : 'text-gray-800'
            }`}>
              Status Aprovação
            </span>
          </div>
          <p className={`text-sm mt-1 ${
            approvedSlot ? 'text-green-700' : 'text-gray-700'
          }`}>
            {approvedSlot ? 'Aprovado' : 'Aguardando'}
          </p>
        </div>
      </div>

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

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">Como funciona:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Envie até 4 vídeos (máx. 15s, horizontal, 100MB)</li>
          <li>• Selecione qual vídeo será exibido nos painéis</li>
          <li>• Aguarde aprovação dos administradores</li>
          <li>• Vídeo aprovado será ativado automaticamente</li>
        </ul>
      </div>
    </div>
  );
};
