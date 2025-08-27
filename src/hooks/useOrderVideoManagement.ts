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
import { supabase } from '@/integrations/supabase/client';
import { toggleForBuildings, normalizeTitle } from '@/services/videoToggleWebhookService';

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

  // Envia webhooks assim que o usuário clica em "Vídeo Principal"
  const sendVideoWebhooks = async (slotId: string) => {
    try {
      // 1) Buscar prédios do pedido
      const { data: pedidoResult, error: pedidoError } = await supabase
        .from('pedidos')
        .select('lista_predios')
        .eq('id', orderId)
        .single();
      if (pedidoError) throw pedidoError;

      const buildingIds = (pedidoResult?.lista_predios || []) as string[];
      if (!buildingIds.length) {
        console.warn('⚠️ [WEBHOOK] Lista de prédios não encontrada para set_base_video');
        return;
      }

      // 2) Buscar vídeo atualmente em exibição via RPC (fonte de verdade no servidor)
      const { data: currentData, error: currentError } = await supabase
        .rpc('get_current_display_video', { p_pedido_id: orderId });
      if (currentError) {
        console.warn('⚠️ [WEBHOOK] Falha ao buscar vídeo atual via RPC:', currentError);
      }
      const currentVideoId: string | undefined =
        Array.isArray(currentData) && currentData[0]?.video_id
          ? (currentData[0].video_id as string)
          : undefined;

      // 3) Resolver o novo vídeo a partir do slot clicado
      const localSlot = videoSlots.find(s => s.id === slotId);
      let newVideoId: string | undefined = localSlot?.video_data?.id || localSlot?.video_id;
      if (!newVideoId) {
        const { data: pvRow } = await supabase
          .from('pedido_videos')
          .select('video_id')
          .eq('id', slotId)
          .single();
        newVideoId = pvRow?.video_id as string | undefined;
      }

      // 4) Helper para obter o nome do vídeo
      const fetchVideoName = async (videoId?: string) => {
        if (!videoId) return undefined;
        const { data, error } = await supabase
          .from('videos')
          .select('nome')
          .eq('id', videoId)
          .single();
        if (error) {
          console.warn('⚠️ [WEBHOOK] Falha ao obter nome do vídeo:', { videoId, error });
          return undefined;
        }
        return data?.nome as string | undefined;
      };

      const [oldVideoName, newVideoName] = await Promise.all([
        currentVideoId && currentVideoId !== newVideoId ? fetchVideoName(currentVideoId) : Promise.resolve(undefined),
        fetchVideoName(newVideoId)
      ]);

      const oldTitle = oldVideoName ? normalizeTitle(oldVideoName) : undefined;
      const newTitle = newVideoName ? normalizeTitle(newVideoName) : undefined;

      console.log('🚀 [WEBHOOK] Enviando webhooks para set_base_video (fonte: RPC):', {
        buildingIdsCount: buildingIds.length,
        oldTitle,
        newTitle,
        orderId,
        slotId,
        currentVideoId,
        newVideoId
      });

      await toggleForBuildings({
        buildingIds,
        toDeactivateTitle: oldTitle,
        toActivateTitle: newTitle,
      });
    } catch (error) {
      console.error('❌ [WEBHOOK] Erro ao enviar webhooks set_base_video:', error);
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
      
      // Health check rápido (timeout de 2s)
      try {
        const healthPromise = testSystemHealth();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), 2000)
        );
        
        const health = await Promise.race([healthPromise, timeoutPromise]) as any;
        if (!health?.overall) {
          console.warn('⚠️ [ORDER_VIDEO] Sistema com problemas, continuando...');
        }
      } catch (healthError) {
        console.warn('⚠️ [ORDER_VIDEO] Health check falhou/timeout, continuando...');
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
      console.log('🔄 [ORDER_VIDEO] Definindo vídeo como principal:', { slotId, orderId });

      const { setBaseVideo: setBaseVideoService } = await import('@/services/videoBaseService');
      
      console.log('⏳ [ORDER_VIDEO] Chamando setBaseVideoService...');
      const success = await setBaseVideoService(slotId);
      
      console.log('📊 [ORDER_VIDEO] Resultado do setBaseVideoService:', success);
      
      if (success) {
        console.log('✅ [ORDER_VIDEO] Vídeo principal definido com sucesso! Enviando webhooks...');
        
        try {
          await sendVideoWebhooks(slotId);
          console.log('✅ [ORDER_VIDEO] Webhooks enviados com sucesso!');
        } catch (webhookError) {
          console.error('❌ [ORDER_VIDEO] Erro nos webhooks (mas vídeo foi definido):', webhookError);
        }
        
        console.log('🔄 [ORDER_VIDEO] Recarregando slots...');
        refreshSlots();
        
        toast.success('✅ Vídeo definido como principal!');
      } else {
        console.error('❌ [ORDER_VIDEO] setBaseVideoService retornou false');
        toast.error('❌ Não foi possível definir o vídeo como principal');
      }
    } catch (error) {
      console.error('💥 [ORDER_VIDEO] Erro ao definir vídeo base:', error);
      toast.error('❌ Erro ao definir vídeo principal');
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
