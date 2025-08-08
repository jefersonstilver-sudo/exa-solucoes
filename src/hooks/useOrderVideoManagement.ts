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
import { useSuccessPopup } from './useSuccessPopup';
import { useConflictModal } from './useConflictModal';

export const useOrderVideoManagement = (orderId: string) => {
  const [videoSlots, setVideoSlots] = useState<VideoSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: number]: number }>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  
  const conflictModal = useConflictModal();

  // Hook do popup de sucesso
  const { isOpen: isSuccessOpen, videoName, showSuccess, hideSuccess } = useSuccessPopup();

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
        is_base_video: false,
        approval_status: 'pending' as const
      })));
    } finally {
      setLoading(false);
    }
  };

  const selectVideoForDisplay = async (slotId: string) => {
    console.log('⭐ [ORDER_VIDEO] Selecionando vídeo para exibição:', slotId);
    
    // Verificação básica do slot local (não bloqueia mais a operação)
    const slot = videoSlots.find(s => s.id === slotId);
    if (!slot) {
      console.error('❌ [ORDER_VIDEO] Slot não encontrado localmente:', slotId);
      toast.error('❌ Vídeo não encontrado');
      return;
    }

    // Info log sobre o status (mas não bloqueia)
    if (slot.approval_status !== 'approved') {
      console.warn('⚠️ [ORDER_VIDEO] Tentativa de seleção de vídeo não aprovado (será validado no servidor):', {
        slotId,
        status: slot.approval_status
      });
    } else {
      console.log('✅ [ORDER_VIDEO] Vídeo aprovado, prosseguindo com seleção/troca');
    }

    // Chamar o serviço que fará a validação real no servidor
    const success = await selectVideoAction(slotId, showSuccess);
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

  const uploadVideo = async (
    slotPosition: number, 
    file: File, 
    userId: string, 
    videoTitle?: string,
    scheduleRules?: any[]
  ) => {
    // Sistema de saúde e métricas otimizado
    const { testSystemHealth, trackPerformanceMetrics } = await import('@/services/videoHealthService');
    const performanceTracker = trackPerformanceMetrics;
    
    try {
      console.log('📤 [ORDER_VIDEO] Upload otimizado iniciado:', { 
        slotPosition, 
        fileName: file.name, 
        fileSize: file.size,
        videoTitle 
      });
      
      // Health check preventivo simplificado
      try {
        const health = await testSystemHealth();
        if (!health.overall) {
          console.warn('⚠️ [ORDER_VIDEO] Sistema com problemas, mas continuando...');
        }
      } catch (healthError) {
        console.warn('⚠️ [ORDER_VIDEO] Health check falhou, continuando...');
      }
      
      setUploading(true);
      setUploadProgress(prev => ({ ...prev, [slotPosition]: 0 }));

      // Validação otimizada de título
      if (videoTitle && (videoTitle.length < 3 || videoTitle.length > 50)) {
        throw new Error('Título deve ter entre 3 e 50 caracteres');
      }

      // Rastrear início da operação
      const startTime = Date.now();
      performanceTracker.recordSuccess();

      const success = await uploadVideoAction(
        slotPosition,
        file,
        userId,
        orderId,
        (progress) => {
          console.log(`📊 [ORDER_VIDEO] Progresso slot ${slotPosition}:`, progress);
          setUploadProgress(prev => ({ ...prev, [slotPosition]: progress }));
          
          // Calcular velocidade de upload
          const elapsed = (Date.now() - startTime) / 1000;
          const bytesUploaded = (file.size * progress) / 100;
          const mbPerSecond = (bytesUploaded / (1024 * 1024)) / elapsed;
          performanceTracker.recordUploadSpeed(mbPerSecond);
        },
        videoTitle,
        scheduleRules
      );

      if (success) {
        console.log('✅ [ORDER_VIDEO] Upload concluído com sucesso');
        performanceTracker.recordSuccess();
        
        // Limpeza otimizada do progresso
        setTimeout(() => {
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[slotPosition];
            return newProgress;
          });
        }, 1500); // Reduzido de 2s para 1.5s

        refreshSlots();
      } else {
        console.error('❌ [ORDER_VIDEO] Upload falhou');
        performanceTracker.recordError();
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[slotPosition];
          return newProgress;
        });
      }
    } catch (error: any) {
      console.error('❌ [ORDER_VIDEO] Erro no upload:', error);
      performanceTracker.recordError();
      
      setUploading(false);
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[slotPosition];
        return newProgress;
      });
      
      // Sistema inteligente de tratamento de erros
      if (error.message === 'SCHEDULE_CONFLICT' && error.conflictData) {
        console.log('🎯 [DEBUG] Conflito de agendamento:', error.conflictData);
        conflictModal.showConflictModal(
          error.conflictData.conflicts,
          error.conflictData.suggestions,
          error.conflictData.newVideoName
        );
        return;
      }
      
      // Erro de conectividade - sugerir retry
      if (error.message.includes('network') || error.message.includes('fetch')) {
        toast.error('❌ Erro de conexão. Verifique sua internet e tente novamente.', {
          action: {
            label: 'Tentar Novamente',
            onClick: () => uploadVideo(slotPosition, file, userId, videoTitle, scheduleRules)
          }
        });
        return;
      }
      
      // Erro de timeout
      if (error.message.includes('timeout') || error.message.includes('time')) {
        toast.error('⏱️ Upload demorou muito. Arquivo muito grande ou conexão lenta.', {
          action: {
            label: 'Retry',
            onClick: () => uploadVideo(slotPosition, file, userId, videoTitle, scheduleRules)
          }
        });
        return;
      }
      
      // Erro genérico com métricas
      const metrics = performanceTracker.getMetrics();
      const shouldRetry = performanceTracker.shouldRetry();
      
      console.log('📊 [ORDER_VIDEO] Métricas atuais:', metrics);
      
      if (shouldRetry) {
        toast.error(error.message || 'Erro no upload', {
          action: {
            label: 'Retry Inteligente',
            onClick: () => uploadVideo(slotPosition, file, userId, videoTitle, scheduleRules)
          }
        });
      } else {
        toast.error(error.message || 'Erro no upload - sistema instável');
      }
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    console.log('🎬 [ORDER_VIDEO] Hook inicializado com orderId:', orderId);
    refreshSlots();
  }, [orderId]);

  const setBaseVideo = async (slotId: string) => {
    try {
      const { setBaseVideo } = await import('@/services/videoBaseService');
      const success = await setBaseVideo(slotId);
      if (success) {
        refreshSlots();
      }
    } catch (error) {
      console.error('Erro ao definir vídeo base:', error);
    }
  };

  return {
    videoSlots,
    loading,
    loadError,
    uploading,
    uploadProgress,
    selectVideoForDisplay,
    activateVideo,
    removeVideo,
    setBaseVideo,
    uploadVideo,
    refreshSlots,
    // Estados do popup de sucesso
    isSuccessOpen,
    videoName,
    hideSuccess,
    // Estados do modal de conflito
    conflictModal
  };
};
