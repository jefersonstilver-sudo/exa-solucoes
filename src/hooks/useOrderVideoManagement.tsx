import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useVideoManagement } from '@/hooks/useVideoManagement';
import { loadVideoSlots } from '@/services/videoSlotService';
import { VideoSlot } from '@/types/videoManagement';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ConflictModalState {
  isOpen: boolean;
  conflicts: any[];
  suggestions: any[];
  newVideoName: string;
  hideConflictModal: () => void;
}

/**
 * Hook completo para gestão de vídeos no portal do anunciante
 * Integra todos os estados de UI necessários (loading, popups, conflitos, etc)
 */
export const useOrderVideoManagement = (orderId: string) => {
  const { userProfile } = useAuth();
  const [orderStatus, setOrderStatus] = useState('pendente');
  const [tipoProduto, setTipoProduto] = useState<string | undefined>(undefined);
  const [maxVideos, setMaxVideos] = useState<number>(10);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Estados de popup de sucesso
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [videoName, setVideoName] = useState('');
  const [isMasterApproved, setIsMasterApproved] = useState(false);
  const [isBaseActivated, setIsBaseActivated] = useState(false);
  // Estados de modal de conflito
  const [conflictModal, setConflictModal] = useState<ConflictModalState>({
    isOpen: false,
    conflicts: [],
    suggestions: [],
    newVideoName: '',
    hideConflictModal: () => {
      setConflictModal(prev => ({ ...prev, isOpen: false }));
    }
  });

  // Buscar status do pedido e max_videos_por_pedido em paralelo
  useEffect(() => {
    const fetchOrderStatus = async () => {
      if (!orderId) return;

      try {
        const { data, error } = await supabase
          .from('pedidos')
          .select('status, tipo_produto')
          .eq('id', orderId)
          .single();

        if (error) throw error;

        if (data) {
          const tp = (data as any).tipo_produto || undefined;
          setOrderStatus(data.status);
          setTipoProduto(tp);

          if (tp) {
            const codigo = tp === 'vertical_premium' || tp === 'vertical' ? 'vertical_premium' : 'horizontal';
            const { data: produto } = await supabase
              .from('produtos_exa')
              .select('max_videos_por_pedido')
              .eq('codigo', codigo)
              .single();
            if (produto && (produto as any).max_videos_por_pedido) {
              setMaxVideos((produto as any).max_videos_por_pedido);
            }
          }
        }
      } catch (error) {
        // silently handle fetch error
      }
    };

    fetchOrderStatus();
  }, [orderId]);

  // Hook base de gestão de vídeos
  const baseHook = useVideoManagement({
    orderId,
    userId: userProfile?.id || '',
    orderStatus,
    tipoProduto
  });

  // Carregar slots inicialmente
  useEffect(() => {
    const loadInitialSlots = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setLoadError(null);
        
        await loadVideoSlots(orderId, maxVideos);

      } catch (error: any) {
        setLoadError(error.message || 'Erro ao carregar vídeos');
      } finally {
        setLoading(false);
      }
    };

    loadInitialSlots();
  }, [orderId, maxVideos]);

  // Função para refresh manual de slots
  const refreshSlots = async (): Promise<void> => {
    if (!orderId) return;
    await loadVideoSlots(orderId, maxVideos);
  };

  // Wrapper para upload com tratamento de sucesso e conflitos
  // IMPORTANTE: só abre popup de sucesso se o upload realmente concluiu.
  const uploadVideo = async (
    slotPosition: number,
    file: File,
    userId: string,
    videoTitle?: string,
    scheduleRules?: any[]
  ) => {
    try {
      const result = await baseHook.handleUpload(slotPosition, file, videoTitle || file.name);

      // Refresh sempre — para refletir o estado real
      await refreshSlots();

      if (!result?.success) {
        // Falha tratada: não abre popup de sucesso, propaga mensagem REAL para o chamador.
        const reason =
          (result as any)?.error ||
          (result as any)?.message ||
          'Não foi possível enviar o vídeo. Verifique duração, formato e tente novamente.';
        const err = new Error(reason);
        (err as any).cause = result;
        throw err;
      }

      setVideoName(videoTitle || file.name);
      setIsMasterApproved(result?.isMasterApproved || false);
      setIsBaseActivated(result?.isBaseActivated || false);
      setIsSuccessOpen(true);
      return result;
    } catch (error: any) {
      // Verificar se é um erro de conflito de horário
      if (error?.message?.includes('conflito') || error?.conflicts || error?.conflictData) {
        const cd = error?.conflictData || {};
        setConflictModal({
          isOpen: true,
          conflicts: cd.conflicts || error.conflicts || [],
          suggestions: cd.suggestions || error.suggestions || [],
          newVideoName: videoTitle || file.name,
          hideConflictModal: () => setConflictModal(prev => ({ ...prev, isOpen: false }))
        });
      }

      throw error;
    }
  };

  // Wrapper para ativação com feedback
  const activateVideo = async (slotId: string) => {
    try {
      await baseHook.handleActivate(slotId);
      const slot = baseHook.videoSlots.find(s => s.id === slotId);
      if (slot?.video_data) {
        setVideoName(slot.video_data.nome);
        setIsSuccessOpen(true);
      }
    } catch (error) {
      throw error;
    }
  };

  // Wrapper para seleção com feedback
  const selectVideoForDisplay = async (slotId: string) => {
    try {
      await baseHook.handleSelectForDisplay(slotId);
      const slot = baseHook.videoSlots.find(s => s.id === slotId);
      if (slot?.video_data) {
        setVideoName(slot.video_data.nome);
        setIsSuccessOpen(true);
      }
    } catch (error) {
      throw error;
    }
  };

  // Wrapper para definir base com feedback
  const setBaseVideo = async (slotId: string) => {
    try {
      await baseHook.handleSetBaseVideo(slotId);
      const slot = baseHook.videoSlots.find(s => s.id === slotId);
      if (slot?.video_data) {
        setVideoName(slot.video_data.nome);
        setIsSuccessOpen(true);
      }
    } catch (error) {
      throw error;
    }
  };

  // Wrapper para remoção com validação crítica
  const removeVideo = async (slotId: string) => {
    try {
      // Buscar slot atual
      const slot = baseHook.videoSlots.find(s => s.id === slotId);

      // Se vídeo rejeitado, permitir remoção direta sem validações
      if (slot?.approval_status === 'rejected') {
        await baseHook.handleRemove(slotId);
        return;
      }

      // Validação: não permitir remover último vídeo aprovado de pedido ativo
      const approvedVideos = baseHook.videoSlots.filter(
        s => s.approval_status === 'approved' && s.id !== slotId
      );
      
      if (approvedVideos.length === 0 && orderStatus === 'video_aprovado') {
        toast.error('Não é possível remover o último vídeo de um pedido ativo.');
        return;
      }

      // Validação backend adicional (apenas para não-rejeitados)
      try {
        const { data: canRemove, error: checkError } = await supabase.rpc('can_remove_video' as any, {
          p_pedido_video_id: slotId
        });

        if (checkError) {
          console.error('Erro ao verificar permissão:', checkError);
          // Se RPC não existe, prosseguir com remoção
        } else if (!canRemove) {
          toast.error('Este vídeo não pode ser removido no momento');
          return;
        }
      } catch {
        // RPC pode não existir, prosseguir
      }

      await baseHook.handleRemove(slotId);
      
    } catch (error: any) {
      console.error('Erro na remoção:', error);
      toast.error(error?.message || 'Erro ao remover vídeo');
    }
  };

  const hideSuccess = () => {
    setIsSuccessOpen(false);
    setIsMasterApproved(false);
    setIsBaseActivated(false);
  };

  return {
    // Estados de loading
    loading: loading,
    loadError,
    
    // Dados dos vídeos
    videoSlots: baseHook.videoSlots,
    
    // Estados de upload
    uploading: baseHook.uploading,
    uploadProgress: baseHook.uploadProgress,
    
    // Funções de gestão de vídeos
    uploadVideo,
    activateVideo,
    removeVideo,
    selectVideoForDisplay,
    setBaseVideo,
    refreshSlots,
    
    // Estados de UI
    isSuccessOpen,
    videoName,
    isMasterApproved,
    isBaseActivated,
    hideSuccess,
    conflictModal,
    
    // Tipo de produto do pedido
    tipoProduto: tipoProduto as string | undefined
  };
};
