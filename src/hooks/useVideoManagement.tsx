
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { uploadVideo } from '@/services/videoUploadService';
import { validateVideoUploadPermission } from '@/services/videoUploadSecurityService';
import { VideoSlot } from '@/types/videoManagement';
import { loadVideoSlots } from '@/services/videoSlotService';
import { setBaseVideo } from '@/services/videoBaseService';

interface UseVideoManagementProps {
  orderId: string;
  userId: string;
  orderStatus: string;
  tipoProduto?: string;
}

export const useVideoManagement = ({ orderId, userId, orderStatus, tipoProduto }: UseVideoManagementProps) => {
  const [videoSlots, setVideoSlots] = useState<VideoSlot[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: number]: number }>({});
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const refreshSlots = useCallback(async () => {
    if (!orderId) return;
    try {
      const slots = await loadVideoSlots(orderId);
      setVideoSlots(slots);
    } catch (error) {
      console.error('Erro ao carregar slots:', error);
    }
  }, [orderId]);

  // Debounced refresh for real-time events
  const debouncedRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    refreshTimeoutRef.current = setTimeout(() => {
      refreshSlots();
    }, 500);
  }, [refreshSlots]);

  // Carregar slots iniciais
  useEffect(() => {
    if (orderId) {
      refreshSlots();
    }
  }, [orderId, refreshSlots]);

  // Real-time subscription para pedido_videos
  useEffect(() => {
    if (!orderId) return;

    const channel = supabase
      .channel(`pedido_videos_${orderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pedido_videos',
          filter: `pedido_id=eq.${orderId}`
        },
        (payload) => {
          console.log('📡 [REALTIME] Mudança em pedido_videos:', payload.eventType);
          debouncedRefresh();
        }
      )
      .subscribe();

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [orderId, debouncedRefresh]);

  // Upload de vídeo com validação de segurança
  const handleUpload = async (slotPosition: number, file: File, title: string) => {
    try {
      // Validação prévia de segurança
      const securityCheck = await validateVideoUploadPermission(orderId);
      if (!securityCheck.canUpload) {
        toast.error(`Upload bloqueado: ${securityCheck.reason}`);
        return;
      }

      setUploading(true);
      setUploadProgress(prev => ({ ...prev, [slotPosition]: 0 }));

      const success = await uploadVideo(
        slotPosition,
        file,
        userId,
        orderId,
        (progress) => {
          setUploadProgress(prev => ({ ...prev, [slotPosition]: progress }));
        },
        title,
        undefined, // scheduleRules
        tipoProduto
      );

      if (success) {
        // Recarregar slots após upload bem-sucedido
        const slots = await loadVideoSlots(orderId);
        setVideoSlots(slots);
      }

    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error('Erro ao fazer upload do vídeo');
    } finally {
      setUploading(false);
      setUploadProgress(prev => {
        const next = { ...prev };
        delete next[slotPosition];
        return next;
      });
    }
  };

  // Ativar vídeo
  const handleActivate = async (slotId: string) => {
    try {
      const { error } = await supabase.rpc('activate_video', {
        p_pedido_id: orderId,
        p_pedido_video_id: slotId
      });

      if (error) throw error;

      toast.success('Vídeo ativado com sucesso!');
      const slots = await loadVideoSlots(orderId);
      setVideoSlots(slots);
    } catch (error) {
      console.error('Erro ao ativar vídeo:', error);
      toast.error('Erro ao ativar vídeo');
    }
  };

  // Remover vídeo
  const handleRemove = async (slotId: string) => {
    try {
      const slot = videoSlots.find(s => s.id === slotId);

      // Vídeos rejeitados podem ser removidos sem validações
      if (slot?.approval_status !== 'rejected') {
        if (slot?.is_base_video) {
          toast.error('Não é possível remover o vídeo principal. Defina outro como principal primeiro.');
          return;
        }

        const activeApprovedVideos = videoSlots.filter(s => 
          s.is_active && 
          s.approval_status === 'approved' &&
          s.id
        );

        if (activeApprovedVideos.length === 1 && activeApprovedVideos[0].id === slotId) {
          toast.error('Não é possível remover o último vídeo ativo. Envie outro vídeo primeiro.');
          return;
        }
      }

      const { error } = await supabase
        .from('pedido_videos')
        .delete()
        .eq('id', slotId);

      if (error) throw error;

      toast.success('Vídeo removido com sucesso!');
      setVideoSlots(prev => prev.filter(s => s.id !== slotId));
    } catch (error: any) {
      console.error('Erro ao remover vídeo:', error);
      toast.error(`Erro ao remover vídeo: ${error.message || 'Erro desconhecido'}`);
    }
  };

  // Selecionar para exibição
  const handleSelectForDisplay = async (slotId: string) => {
    console.log('🔄 [HOOK] handleSelectForDisplay iniciado:', { slotId, orderId });
    
    try {
      // 1) BUSCAR VÍDEO ATUALMENTE SELECIONADO ANTES DA MUDANÇA
      console.log('🔍 [WEBHOOK] Buscando vídeo selecionado atual...');
      
      const { data: currentSelectedVideo, error: currentSelectedError } = await supabase
        .from('pedido_videos')
        .select('video_id')
        .eq('pedido_id', orderId)
        .eq('selected_for_display', true)
        .single();
      
      let oldVideoId: string | undefined = undefined;
      
      if (!currentSelectedError && currentSelectedVideo) {
        oldVideoId = currentSelectedVideo.video_id as string;
        console.log('✅ [WEBHOOK] Vídeo selecionado atual encontrado:', { oldVideoId });
      } else {
        console.warn('⚠️ [WEBHOOK] Nenhum vídeo selecionado atual encontrado:', currentSelectedError);
      }

      // 2) BUSCAR DADOS DO PEDIDO EM PARALELO
      const [pedidoResult, newVideoResult] = await Promise.all([
        supabase
          .from('pedidos')
          .select('lista_predios')
          .eq('id', orderId)
          .single(),
        supabase
          .from('pedido_videos')
          .select('video_id')
          .eq('id', slotId)
          .single()
      ]);

      // 3) EXECUTAR A MUDANÇA
      const success = await setBaseVideo(slotId);
      if (!success) {
        throw new Error('Falha ao definir vídeo como base');
      }

      // 4) ENVIAR WEBHOOKS APÓS SUCESSO
      if (pedidoResult.data?.lista_predios) {
        const buildingIds = pedidoResult.data.lista_predios as string[];
        const newVideoId = newVideoResult.data?.video_id as string | undefined;
        
        console.log('📊 [WEBHOOK] Dados coletados para seleção:', { 
          buildingIdsCount: buildingIds.length, 
          oldVideoId, 
          newVideoId,
          willDeactivate: !!oldVideoId && oldVideoId !== newVideoId,
          willActivate: !!newVideoId
        });

        // 5) BUSCAR NOMES DOS VÍDEOS
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

        // API externa será sincronizada automaticamente pelo videoBaseService.ts
        console.log('✅ API externa será sincronizada automaticamente');
      } else {
        console.warn('⚠️ Lista de prédios não encontrada');
      }

      toast.success('Vídeo selecionado para exibição!');
      
      // 6) RECARREGAR SLOTS
      console.log('🔄 [HOOK] Recarregando slots após seleção...');
      const slots = await loadVideoSlots(orderId);
      
      console.log('📊 [HOOK] Slots carregados após seleção:', {
        totalSlots: slots.length,
        slotsData: slots.map(slot => ({
          position: slot.slot_position,
          hasVideo: !!slot.video_data,
          videoName: slot.video_data?.nome,
          selectedForDisplay: slot.selected_for_display,
          slotId: slot.id
        }))
      });
      
      setVideoSlots(slots);
      console.log('✅ [HOOK] Estado atualizado com novos slots');
    } catch (error) {
      console.error('Erro ao selecionar vídeo:', error);
      toast.error('Erro ao selecionar vídeo');
    }
  };

  // Download de vídeo
  const handleDownload = (videoUrl: string, fileName: string) => {
    window.open(videoUrl, '_blank');
  };

  // Removed n8n webhook integration - API sync is handled by videoBaseService.ts

  // Definir vídeo base
  const handleSetBaseVideo = async (slotId: string) => {
    console.log('🔄 [HOOK] handleSetBaseVideo iniciado:', { slotId, orderId });
    
    try {
      // 1) BUSCAR O VÍDEO BASE ATUAL ANTES DA MUDANÇA (DIRETO NA TABELA) COM SLOT
      console.log('🔍 [WEBHOOK] Buscando vídeo base atual diretamente...');
      
      const { data: currentBaseVideo, error: currentBaseError } = await supabase
        .from('pedido_videos')
        .select('video_id, slot_position')
        .eq('pedido_id', orderId)
        .eq('is_base_video', true)
        .single();
      
      let oldVideoId: string | undefined = undefined;
      let oldSlot: number | undefined = undefined;
      
      if (!currentBaseError && currentBaseVideo) {
        oldVideoId = currentBaseVideo.video_id as string;
        oldSlot = currentBaseVideo.slot_position as number;
        console.log('✅ [WEBHOOK] Vídeo base atual encontrado:', { oldVideoId, oldSlot });
      } else {
        console.warn('⚠️ [WEBHOOK] Nenhum vídeo base atual encontrado:', currentBaseError);
      }

      // 2) EXECUTAR A MUDANÇA NO BANCO
      console.log('🔄 [WEBHOOK] Executando setBaseVideo...');
      const result = await setBaseVideo(slotId);
      
      // 3) VERIFICAR RESULTADO E MOSTRAR MENSAGEM ESPECÍFICA
      if (!result.success) {
        const errorMessage = result.message || 'Falha ao definir vídeo como base';
        console.error('❌ [HOOK] Falha ao definir vídeo base:', errorMessage);
        toast.error(errorMessage);
        return;
      }

      // 4) BUSCAR DADOS PARA OS WEBHOOKS APÓS A MUDANÇA COM SLOT
      console.log('🔄 [WEBHOOK] Buscando dados para webhook...');
      const [pedidoResult, newVideoResult] = await Promise.all([
        supabase
          .from('pedidos')
          .select('lista_predios')
          .eq('id', orderId)
          .single(),
        supabase
          .from('pedido_videos')
          .select('video_id, slot_position')
          .eq('id', slotId)
          .single()
      ]);

      if (pedidoResult.error) throw pedidoResult.error;
      if (newVideoResult.error) throw newVideoResult.error;

      const buildingIds = (pedidoResult.data?.lista_predios || []) as string[];
      const newVideoId = newVideoResult.data?.video_id as string | undefined;
      const newSlot = newVideoResult.data?.slot_position as number | undefined;

      console.log('📊 [WEBHOOK] Dados coletados:', { 
        buildingIdsCount: buildingIds.length, 
        oldVideoId, 
        oldSlot,
        newVideoId,
        newSlot,
        willDeactivate: !!oldVideoId && oldVideoId !== newVideoId,
        willActivate: !!newVideoId
      });

      // 5) API externa será sincronizada automaticamente pelo videoBaseService.ts
      console.log('✅ API externa será sincronizada automaticamente');

      toast.success('✅ Vídeo definido como principal e selecionado para exibição!');
      
      // 6) RECARREGAR SLOTS PARA REFLETIR MUDANÇAS
      const slots = await loadVideoSlots(orderId);
      setVideoSlots(slots);
      console.log('✅ [HOOK] Vídeo base definido com sucesso');

    } catch (error: any) {
      const errorMessage = error?.message || 'Erro ao definir vídeo base';
      console.error('❌ [HOOK] Erro ao definir vídeo base:', error);
      toast.error(errorMessage);
    }
  };

  return {
    videoSlots,
    uploading,
    uploadProgress,
    handleUpload,
    handleActivate,
    handleRemove,
    handleSelectForDisplay,
    handleDownload,
    handleSetBaseVideo
  };
};
