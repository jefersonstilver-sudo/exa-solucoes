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
  console.log('🎬 [useOrderVideoManagement] Hook inicializado:', { orderId });
  
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
      console.log('🚫 [useOrderVideoManagement] Fechando modal de conflito');
      setConflictModal(prev => ({ ...prev, isOpen: false }));
    }
  });

  // Buscar status do pedido e max_videos_por_pedido
  useEffect(() => {
    const fetchOrderStatus = async () => {
      if (!orderId) return;
      
      try {
        console.log('📊 [useOrderVideoManagement] Buscando status do pedido:', orderId);
        const { data, error } = await supabase
          .from('pedidos')
          .select('status, tipo_produto')
          .eq('id', orderId)
          .single();
        
        if (error) throw error;
        
        if (data) {
          const tp = (data as any).tipo_produto || undefined;
          console.log('✅ [useOrderVideoManagement] Status do pedido:', data.status, 'Tipo produto:', tp);
          setOrderStatus(data.status);
          setTipoProduto(tp);

          // Buscar max_videos_por_pedido do produto
          if (tp) {
            const codigo = tp === 'vertical_premium' || tp === 'vertical' ? 'vertical_premium' : 'horizontal';
            const { data: produto } = await supabase
              .from('produtos_exa')
              .select('max_videos_por_pedido')
              .eq('codigo', codigo)
              .single();
            if (produto && (produto as any).max_videos_por_pedido) {
              setMaxVideos((produto as any).max_videos_por_pedido);
              console.log('📦 [useOrderVideoManagement] Max vídeos por pedido:', (produto as any).max_videos_por_pedido);
            }
          }
        }
      } catch (error) {
        console.error('❌ [useOrderVideoManagement] Erro ao buscar status:', error);
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
        console.log('🔄 [useOrderVideoManagement] Carregando slots iniciais');
        setLoading(true);
        setLoadError(null);
        
        const slots = await loadVideoSlots(orderId, maxVideos);
        console.log('✅ [useOrderVideoManagement] Slots carregados:', slots.length);
        
      } catch (error: any) {
        console.error('❌ [useOrderVideoManagement] Erro ao carregar slots:', error);
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
    
    try {
      console.log('🔄 [useOrderVideoManagement] Refresh de slots solicitado');
      const slots = await loadVideoSlots(orderId, maxVideos);
      console.log('✅ [useOrderVideoManagement] Refresh concluído:', slots.length, 'slots');
    } catch (error) {
      console.error('❌ [useOrderVideoManagement] Erro no refresh:', error);
      throw error;
    }
  };

  // Wrapper para upload com tratamento de sucesso e conflitos
  const uploadVideo = async (
    slotPosition: number, 
    file: File, 
    userId: string, 
    videoTitle?: string, 
    scheduleRules?: any[]
  ) => {
    console.log('📤 [useOrderVideoManagement] Upload iniciado:', { 
      slotPosition, 
      fileName: file.name,
      videoTitle,
      hasScheduleRules: !!scheduleRules
    });
    
    try {
      const result = await baseHook.handleUpload(slotPosition, file, videoTitle || file.name);
      
      console.log('✅ [useOrderVideoManagement] Upload concluído com sucesso', result);
      setVideoName(videoTitle || file.name);
      setIsMasterApproved(result?.isMasterApproved || false);
      setIsBaseActivated(result?.isBaseActivated || false);
      setIsSuccessOpen(true);
      
      // Refresh automático após upload
      await refreshSlots();
      
    } catch (error: any) {
      console.error('❌ [useOrderVideoManagement] Erro no upload:', error);
      
      // Verificar se é um erro de conflito de horário
      if (error.message?.includes('conflito') || error.conflicts) {
        console.log('⚠️ [useOrderVideoManagement] Conflito detectado:', error.conflicts);
        setConflictModal({
          isOpen: true,
          conflicts: error.conflicts || [],
          suggestions: error.suggestions || [],
          newVideoName: videoTitle || file.name,
          hideConflictModal: () => setConflictModal(prev => ({ ...prev, isOpen: false }))
        });
      }
      
      throw error;
    }
  };

  // Wrapper para ativação com feedback
  const activateVideo = async (slotId: string) => {
    console.log('🎯 [useOrderVideoManagement] Ativação iniciada:', { slotId });
    
    try {
      await baseHook.handleActivate(slotId);
      
      // Buscar nome do vídeo para o popup
      const slot = baseHook.videoSlots.find(s => s.id === slotId);
      if (slot?.video_data) {
        setVideoName(slot.video_data.nome);
        setIsSuccessOpen(true);
      }
      
      console.log('✅ [useOrderVideoManagement] Vídeo ativado:', slot?.video_data?.nome);
      
    } catch (error) {
      console.error('❌ [useOrderVideoManagement] Erro na ativação:', error);
      throw error;
    }
  };

  // Wrapper para seleção com feedback
  const selectVideoForDisplay = async (slotId: string) => {
    console.log('🎬 [useOrderVideoManagement] Seleção para exibição:', { slotId });
    
    try {
      await baseHook.handleSelectForDisplay(slotId);
      
      // Buscar nome do vídeo para o popup
      const slot = baseHook.videoSlots.find(s => s.id === slotId);
      if (slot?.video_data) {
        setVideoName(slot.video_data.nome);
        setIsSuccessOpen(true);
      }
      
      console.log('✅ [useOrderVideoManagement] Vídeo selecionado:', slot?.video_data?.nome);
      
    } catch (error) {
      console.error('❌ [useOrderVideoManagement] Erro na seleção:', error);
      throw error;
    }
  };

  // Wrapper para definir base com feedback
  const setBaseVideo = async (slotId: string) => {
    console.log('⭐ [useOrderVideoManagement] Definindo vídeo base:', { slotId });
    
    try {
      await baseHook.handleSetBaseVideo(slotId);
      
      // Buscar nome do vídeo para o popup
      const slot = baseHook.videoSlots.find(s => s.id === slotId);
      if (slot?.video_data) {
        setVideoName(slot.video_data.nome);
        setIsSuccessOpen(true);
      }
      
      console.log('✅ [useOrderVideoManagement] Vídeo base definido:', slot?.video_data?.nome);
      
    } catch (error) {
      console.error('❌ [useOrderVideoManagement] Erro ao definir base:', error);
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
    console.log('✅ [useOrderVideoManagement] Fechando popup de sucesso');
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
