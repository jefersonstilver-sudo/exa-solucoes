import { useState, useEffect } from 'react';
import { VideoSlot, VideoManagementState } from '@/types/videoManagement';
import { loadVideoSlots } from '@/services/videoSlotService';
import { 
  selectVideoForDisplay as selectVideoAction, 
  activateVideo as activateVideoAction, 
  removeVideo as removeVideoAction 
} from '@/services/videoActionService';
import { uploadVideo as uploadVideoAction } from '@/services/videoUploadService';
import { setBaseVideo as setBaseVideoService } from '@/services/videoBaseService';
import { toast } from 'sonner';
import { useSuccessPopup } from './useSuccessPopup';
import { useConflictModal } from './useConflictModal';
import { supabase } from '@/integrations/supabase/client';

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
      console.log('✅ [ORDER_VIDEO] Slots carregados com schedule_rules:', slots.map(s => ({ 
        slot: s.slot_position, 
        hasRules: s.schedule_rules?.length || 0,
        rules: s.schedule_rules 
      })));
      
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

  // Removed n8n webhook integration - API sync is handled by videoBaseService.ts

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
    try {
      console.log('📤 [ORDER_VIDEO] Upload iniciado:', { 
        slotPosition, 
        fileName: file.name, 
        fileSize: file.size,
        videoTitle,
        orderId
      });
      
      setUploading(true);
      setUploadProgress(prev => ({ ...prev, [slotPosition]: 0 }));

      // Validação otimizada de título
      if (videoTitle && (videoTitle.length < 3 || videoTitle.length > 50)) {
        throw new Error('Título deve ter entre 3 e 50 caracteres');
      }

      // Rastrear início da operação
      const startTime = Date.now();

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
          console.log(`⚡ [ORDER_VIDEO] Velocidade de upload: ${mbPerSecond.toFixed(2)} MB/s`);
        },
        videoTitle,
        scheduleRules
      );

      if (success) {
        console.log('✅ [ORDER_VIDEO] Upload concluído com sucesso');
        
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
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[slotPosition];
          return newProgress;
        });
      }
    } catch (error: any) {
      console.error('❌ [ORDER_VIDEO] Erro no upload:', error);
      
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
      
      // Erro de conectividade - retry imediato com backoff
      if (error.message.includes('network') || error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
        toast.error('❌ Falha de rede detectada', {
          description: 'Tentativa automática em 3 segundos...',
          action: {
            label: 'Retry Agora',
            onClick: () => uploadVideo(slotPosition, file, userId, videoTitle, scheduleRules)
          }
        });
        
        // Retry automático após 3 segundos
        setTimeout(() => {
          uploadVideo(slotPosition, file, userId, videoTitle, scheduleRules);
        }, 3000);
        return;
      }
      
      // Erro de timeout - estratégias diferentes baseadas no tamanho
      if (error.message.includes('timeout') || error.message.includes('time')) {
        const fileSizeMB = file.size / (1024 * 1024);
        const strategy = fileSizeMB > 50 ? 'Arquivo grande' : 'Conexão lenta';
        
        toast.error(`⏱️ Timeout: ${strategy} detectado`, {
          description: `Arquivo: ${fileSizeMB.toFixed(1)}MB`,
          action: {
            label: 'Retry Otimizado',
            onClick: () => uploadVideo(slotPosition, file, userId, videoTitle, scheduleRules)
          }
        });
        return;
      }
      
      // Erro genérico - sempre permitir retry
      console.log('📊 [ORDER_VIDEO] Erro genérico capturado');
      
      toast.error(error.message || 'Erro no upload', {
        action: {
          label: 'Tentar Novamente',
          onClick: () => uploadVideo(slotPosition, file, userId, videoTitle, scheduleRules)
        }
      });
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    console.log('🎬 [ORDER_VIDEO] Hook inicializado com orderId:', orderId);
    refreshSlots();
  }, [orderId]);

  const setBaseVideo = async (slotId: string): Promise<{success: boolean, response: any}> => {
    try {
      console.log('🔄 [ORDER_VIDEO] === INÍCIO setBaseVideo ===');
      console.log('🔄 [ORDER_VIDEO] Parâmetros:', { slotId, orderId });

      // 1) Capturar estado ANTES da mudança: vídeo base atual (com slot)
      console.log('📊 [ORDER_VIDEO] Buscando vídeo base atual...');
      const { data: currentBase, error: currentBaseErr } = await supabase
        .from('pedido_videos')
        .select('video_id, slot_position')
        .eq('pedido_id', orderId)
        .eq('is_base_video', true)
        .single();

      if (currentBaseErr) {
        console.warn('⚠️ Não foi possível obter o vídeo base atual:', currentBaseErr);
      } else {
        console.log('✅ Vídeo base atual:', { video_id: currentBase?.video_id });
      }

      // 2) Capturar dados do NOVO vídeo (slot clicado)
      console.log('📊 [ORDER_VIDEO] Buscando dados do novo vídeo...');
      const { data: newPv, error: newPvErr } = await supabase
        .from('pedido_videos')
        .select('video_id, slot_position, approval_status')
        .eq('id', slotId)
        .single();

      if (newPvErr) {
        console.error('❌ [ORDER_VIDEO] Erro ao buscar novo vídeo:', newPvErr);
        throw newPvErr;
      }
      
      console.log('📊 [ORDER_VIDEO] Novo vídeo encontrado:', newPv);
      
      if (newPv?.approval_status !== 'approved') {
        console.error('❌ [ORDER_VIDEO] Vídeo não está aprovado:', newPv?.approval_status);
        toast.error('❌ Vídeo precisa estar aprovado para ser definido como principal');
        return { success: false, response: { error: 'Vídeo não aprovado', approval_status: newPv?.approval_status } };
      }

      // 3) Usar videoBaseService que contém toda lógica de fallback e sync com API externa
      console.log('⏳ [ORDER_VIDEO] Chamando setBaseVideo do videoBaseService...');
      const success = await setBaseVideoService(slotId);

      // Criar objeto de resposta detalhado
      const apiResponse: any = {
        success,
        timestamp: new Date().toISOString(),
        pedido_video_id: slotId,
        video_id: newPv?.video_id,
        message: success ? 'Vídeo definido como principal e sincronizado com API externa' : 'Falha ao definir vídeo como principal'
      };

      if (!success) {
        console.error('❌ [ORDER_VIDEO] Falha ao definir vídeo base');
        toast.error('❌ Não foi possível definir o vídeo como principal');
        return { success: false, response: apiResponse };
      }

      console.log('✅ [ORDER_VIDEO] Vídeo base definido com sucesso e API externa sincronizada');

      console.log('🔄 [ORDER_VIDEO] Recarregando slots...');
      refreshSlots();
      toast.success('✅ Vídeo definido como principal!');
      
      return { success: true, response: apiResponse };
    } catch (error) {
      console.error('💥 [ORDER_VIDEO] Erro ao definir vídeo base:', error);
      console.error('💥 [ORDER_VIDEO] Stack:', (error as Error)?.stack);
      toast.error('❌ Erro ao definir vídeo principal');
      
      return { 
        success: false, 
        response: { 
          error: (error as Error)?.message || 'Erro desconhecido',
          timestamp: new Date().toISOString()
        } 
      };
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
