
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { uploadVideo } from '@/services/videoUploadService';
import { validateVideoUploadPermission } from '@/services/videoUploadSecurityService';
import { VideoSlot } from '@/types/videoManagement';
import { loadVideoSlots } from '@/services/videoSlotService';
import { setBaseVideo } from '@/services/videoBaseService';
import { normalizeTitle, toggleForBuildings } from '@/services/videoToggleWebhookService';

interface UseVideoManagementProps {
  orderId: string;
  userId: string;
  orderStatus: string;
}

export const useVideoManagement = ({ orderId, userId, orderStatus }: UseVideoManagementProps) => {
  const [videoSlots, setVideoSlots] = useState<VideoSlot[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: number]: number }>({});

  // Carregar slots de vídeo
  useEffect(() => {
    const fetchVideoSlots = async () => {
      try {
        const slots = await loadVideoSlots(orderId);
        setVideoSlots(slots);
      } catch (error) {
        console.error('Erro ao carregar slots:', error);
        toast.error('Erro ao carregar vídeos');
      }
    };

    if (orderId) {
      fetchVideoSlots();
    }
  }, [orderId]);

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
        title
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
      setUploadProgress(prev => ({ ...prev, [slotPosition]: 0 }));
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
      const { error } = await supabase
        .from('pedido_videos')
        .delete()
        .eq('id', slotId);

      if (error) throw error;

      toast.success('Vídeo removido com sucesso!');
      setVideoSlots(prev => prev.filter(slot => slot.id !== slotId));
    } catch (error) {
      console.error('Erro ao remover vídeo:', error);
      toast.error('Erro ao remover vídeo');
    }
  };

  // Selecionar para exibição
  const handleSelectForDisplay = async (slotId: string) => {
    console.log('🔄 [HOOK] handleSelectForDisplay iniciado:', { slotId, orderId });
    
    try {
      // Buscar vídeo atualmente selecionado e dados do pedido
      const [currentSelectedResult, pedidoResult, newVideoResult] = await Promise.all([
        supabase
          .from('pedido_videos')
          .select('video_data:videos(nome)')
          .eq('pedido_id', orderId)
          .eq('selected_for_display', true)
          .single(),
        supabase
          .from('pedidos')
          .select('lista_predios')
          .eq('id', orderId)
          .single(),
        supabase
          .from('pedido_videos')
          .select('video_data:videos(nome)')
          .eq('id', slotId)
          .single()
      ]);

      // Executar via função transacional para garantir consistência
      const success = await setBaseVideo(slotId);
      if (!success) {
        throw new Error('Falha ao definir vídeo como base');
      }

      // Enviar webhooks após sucesso no Supabase
      if (pedidoResult.data?.lista_predios) {
        const buildingIds = pedidoResult.data.lista_predios as string[];
        const oldVideoName = currentSelectedResult.data?.video_data?.nome;
        const newVideoName = newVideoResult.data?.video_data?.nome;
        
        const oldTitle = oldVideoName ? normalizeTitle(oldVideoName) : undefined;
        const newTitle = newVideoName ? normalizeTitle(newVideoName) : undefined;
        
        console.log('🚀 [WEBHOOK] Enviando webhooks de seleção:', { 
          buildingIdsCount: buildingIds.length, 
          oldTitle,
          newTitle,
          orderId,
          slotId
        });
        
        // Enviar desativação do antigo (se houver) e ativação do novo
        toggleForBuildings({
          buildingIds,
          toActivateTitle: newTitle,
          toDeactivateTitle: oldTitle && oldTitle !== newTitle ? oldTitle : undefined
        }).catch(error => {
          console.error('❌ [WEBHOOK] Erro ao enviar webhooks de seleção:', error);
        });
      } else {
        console.warn('⚠️ [WEBHOOK] Lista de prédios não encontrada');
      }

      toast.success('Vídeo selecionado para exibição!');
      
      // Recarregar slots e verificar se a atualização funcionou
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

  // Função auxiliar para enviar webhooks
  const sendVideoWebhooks = async (slotId: string, actionType: string) => {
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
        console.warn(`⚠️ [WEBHOOK] Lista de prédios não encontrada para ${actionType}`);
        return;
      }

      // 2) Buscar vídeo atualmente em exibição via RPC
      const { data: currentData, error: currentError } = await supabase
        .rpc('get_current_display_video', { p_pedido_id: orderId });
      if (currentError) {
        console.warn('⚠️ [WEBHOOK] Falha ao buscar vídeo atual via RPC:', currentError);
      }
      const currentVideoId: string | undefined =
        Array.isArray(currentData) && currentData[0]?.video_id
          ? (currentData[0].video_id as string)
          : undefined;

      // 3) Obter o vídeo do slot informado
      const { data: pvRow } = await supabase
        .from('pedido_videos')
        .select('video_id')
        .eq('id', slotId)
        .single();
      const newVideoId: string | undefined = pvRow?.video_id as string | undefined;

      // 4) Helper para buscar nomes
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

      console.log(`🚀 [WEBHOOK] Enviando webhooks para ${actionType} (fonte: RPC):`, {
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
        toActivateTitle: newTitle
      });
    } catch (error) {
      console.error(`❌ [WEBHOOK] Erro ao processar webhooks de ${actionType}:`, error);
    }
  };

  // Definir vídeo base
  const handleSetBaseVideo = async (slotId: string) => {
    console.log('🔄 [HOOK] handleSetBaseVideo iniciado:', { slotId, orderId });
    
    try {
      // 1) BUSCAR O VÍDEO ATUAL ANTES DA MUDANÇA
      const { data: currentVideoData, error: currentVideoError } = await supabase
        .rpc('get_current_display_video', { p_pedido_id: orderId });
      
      if (currentVideoError) {
        console.warn('⚠️ [WEBHOOK] Falha ao buscar vídeo atual antes da mudança:', currentVideoError);
      }
      
      const oldVideoId: string | undefined =
        Array.isArray(currentVideoData) && currentVideoData[0]?.video_id
          ? (currentVideoData[0].video_id as string)
          : undefined;

      console.log('📺 [HOOK] Vídeo atual antes da mudança:', { oldVideoId });

      // 2) EXECUTAR A MUDANÇA NO BANCO
      const success = await setBaseVideo(slotId);
      if (!success) {
        throw new Error('Falha ao definir vídeo como base');
      }

      // 3) BUSCAR DADOS PARA OS WEBHOOKS APÓS A MUDANÇA
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

      if (pedidoResult.error) throw pedidoResult.error;
      if (newVideoResult.error) throw newVideoResult.error;

      const buildingIds = (pedidoResult.data?.lista_predios || []) as string[];
      const newVideoId = newVideoResult.data?.video_id as string | undefined;

      console.log('🔄 [HOOK] Dados para webhook:', { 
        buildingIdsCount: buildingIds.length, 
        oldVideoId, 
        newVideoId 
      });

      // 4) BUSCAR NOMES DOS VÍDEOS EM PARALELO
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
        oldVideoId && oldVideoId !== newVideoId ? fetchVideoName(oldVideoId) : Promise.resolve(undefined),
        fetchVideoName(newVideoId)
      ]);

      // 5) NORMALIZAR TÍTULOS E ENVIAR WEBHOOKS EM PARALELO
      const oldTitle = oldVideoName ? normalizeTitle(oldVideoName) : undefined;
      const newTitle = newVideoName ? normalizeTitle(newVideoName) : undefined;

      console.log('🚀 [WEBHOOK] Enviando webhooks de troca de vídeo base:', {
        buildingIdsCount: buildingIds.length,
        toDeactivateTitle: oldTitle,
        toActivateTitle: newTitle,
        orderId,
        slotId
      });

      if (buildingIds.length > 0) {
        // Enviar webhooks: desativar o antigo (se houver e for diferente) + ativar o novo
        toggleForBuildings({
          buildingIds,
          toDeactivateTitle: oldTitle && oldTitle !== newTitle ? oldTitle : undefined,
          toActivateTitle: newTitle
        }).catch(error => {
          console.error('❌ [WEBHOOK] Erro ao enviar webhooks de troca:', error);
        });
      } else {
        console.warn('⚠️ [WEBHOOK] Lista de prédios vazia, pulando webhooks');
      }

      toast.success('Vídeo definido como principal e selecionado para exibição!');
      
      // 6) RECARREGAR SLOTS PARA REFLETIR MUDANÇAS
      const slots = await loadVideoSlots(orderId);
      setVideoSlots(slots);
      console.log('✅ [HOOK] Vídeo base definido com sucesso');

    } catch (error) {
      console.error('Erro ao definir vídeo base:', error);
      toast.error('Erro ao definir vídeo base');
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
