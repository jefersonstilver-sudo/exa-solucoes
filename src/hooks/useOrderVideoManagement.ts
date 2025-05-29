
import { useState, useEffect } from 'react';
import { VideoSlot, VideoManagementState } from '@/types/videoManagement';
import { loadVideoSlots } from '@/services/videoSlotService';
import { 
  selectVideoForDisplay as selectVideoAction, 
  activateVideo as activateVideoAction, 
  removeVideo as removeVideoAction 
} from '@/services/videoActionService';
import { uploadVideo as uploadVideoAction } from '@/services/videoUploadService';
import { toast } from 'sonner';

export const useOrderVideoManagement = (orderId: string) => {
  const [videoSlots, setVideoSlots] = useState<VideoSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: number]: number }>({});
  const [loadError, setLoadError] = useState<string | null>(null);

  const refreshSlots = async () => {
    if (!orderId) {
      console.log('🚫 [ORDER_VIDEO] OrderId não fornecido');
      setLoading(false);
      return;
    }

    try {
      console.log('🔄 [ORDER_VIDEO] Iniciando refresh para pedido:', orderId);
      setLoading(true);
      setLoadError(null);
      
      const slots = await loadVideoSlots(orderId);
      console.log('✅ [ORDER_VIDEO] Slots carregados:', slots);
      
      setVideoSlots(slots);
      
      // Verificar se há vídeos válidos
      const videosComDados = slots.filter(slot => slot.video_data);
      console.log('📊 [ORDER_VIDEO] Vídeos com dados:', videosComDados.length);
      
    } catch (error) {
      console.error('❌ [ORDER_VIDEO] Erro ao carregar vídeos:', error);
      setLoadError(error instanceof Error ? error.message : 'Erro desconhecido');
      
      // Definir slots vazios em caso de erro para evitar loading infinito
      setVideoSlots([1, 2, 3, 4].map(position => ({
        slot_position: position,
        is_active: false,
        selected_for_display: false,
        approval_status: 'pending' as const
      })));
    } finally {
      setLoading(false);
    }
  };

  const selectVideoForDisplay = async (slotId: string) => {
    console.log('⭐ [ORDER_VIDEO] Tentativa de seleção de vídeo:', slotId);
    
    // NOVA VALIDAÇÃO: Verificar status de aprovação ANTES de chamar o serviço
    const slot = videoSlots.find(s => s.id === slotId);
    if (!slot) {
      console.error('❌ [ORDER_VIDEO] Slot não encontrado:', slotId);
      toast.error('❌ Vídeo não encontrado');
      return;
    }

    if (slot.approval_status !== 'approved') {
      console.warn('⚠️ [ORDER_VIDEO] Tentativa de selecionar vídeo não aprovado:', {
        slotId,
        status: slot.approval_status
      });
      
      const statusMessages = {
        'pending': 'Este vídeo ainda está aguardando aprovação dos administradores.',
        'rejected': 'Este vídeo foi rejeitado e não pode ser selecionado para exibição.'
      };
      
      const message = statusMessages[slot.approval_status as keyof typeof statusMessages] || 
                     'Apenas vídeos aprovados podem ser selecionados para exibição.';
      
      toast.error(`❌ Seleção bloqueada: ${message}`);
      return;
    }

    console.log('✅ [ORDER_VIDEO] Vídeo aprovado, prosseguindo com seleção');
    const success = await selectVideoAction(slotId);
    if (success) {
      refreshSlots();
    }
  };

  const activateVideo = async (slotId: string) => {
    console.log('▶️ [ORDER_VIDEO] Ativando vídeo:', slotId);
    const success = await activateVideoAction(slotId, orderId);
    if (success) {
      refreshSlots();
    }
  };

  const removeVideo = async (slotId: string) => {
    console.log('🗑️ [ORDER_VIDEO] Removendo vídeo:', slotId);
    const success = await removeVideoAction(slotId, videoSlots);
    if (success) {
      refreshSlots();
    }
  };

  const uploadVideo = async (slotPosition: number, file: File, userId: string) => {
    try {
      console.log('📤 [ORDER_VIDEO] Iniciando upload:', { slotPosition, fileName: file.name, fileSize: file.size });
      setUploading(true);
      setUploadProgress(prev => ({ ...prev, [slotPosition]: 0 }));

      const success = await uploadVideoAction(
        slotPosition,
        file,
        userId,
        orderId,
        (progress) => {
          console.log(`📊 [ORDER_VIDEO] Progresso upload slot ${slotPosition}:`, progress);
          setUploadProgress(prev => ({ ...prev, [slotPosition]: progress }));
        }
      );

      if (success) {
        console.log('✅ [ORDER_VIDEO] Upload concluído com sucesso');
        // Limpar progresso após um tempo
        setTimeout(() => {
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[slotPosition];
            return newProgress;
          });
        }, 2000);

        refreshSlots();
      } else {
        console.error('❌ [ORDER_VIDEO] Upload falhou');
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[slotPosition];
          return newProgress;
        });
      }
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    console.log('🎬 [ORDER_VIDEO] Hook inicializado com orderId:', orderId);
    refreshSlots();
  }, [orderId]);

  return {
    videoSlots,
    loading,
    loadError,
    uploading,
    uploadProgress,
    selectVideoForDisplay,
    activateVideo,
    removeVideo,
    uploadVideo,
    refreshSlots
  };
};
