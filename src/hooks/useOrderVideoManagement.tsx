import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useVideoManagement } from '@/hooks/useVideoManagement';
import { loadVideoSlots } from '@/services/videoSlotService';
import { VideoSlot } from '@/types/videoManagement';
import { supabase } from '@/integrations/supabase/client';

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
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Estados de popup de sucesso
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [videoName, setVideoName] = useState('');
  
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

  // Buscar status do pedido
  useEffect(() => {
    const fetchOrderStatus = async () => {
      if (!orderId) return;
      
      try {
        console.log('📊 [useOrderVideoManagement] Buscando status do pedido:', orderId);
        const { data, error } = await supabase
          .from('pedidos')
          .select('status')
          .eq('id', orderId)
          .single();
        
        if (error) throw error;
        
        if (data) {
          console.log('✅ [useOrderVideoManagement] Status do pedido:', data.status);
          setOrderStatus(data.status);
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
    orderStatus
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
        
        const slots = await loadVideoSlots(orderId);
        console.log('✅ [useOrderVideoManagement] Slots carregados:', slots.length);
        
      } catch (error: any) {
        console.error('❌ [useOrderVideoManagement] Erro ao carregar slots:', error);
        setLoadError(error.message || 'Erro ao carregar vídeos');
      } finally {
        setLoading(false);
      }
    };

    loadInitialSlots();
  }, [orderId]);

  // Função para refresh manual de slots
  const refreshSlots = async () => {
    if (!orderId) return;
    
    try {
      console.log('🔄 [useOrderVideoManagement] Refresh de slots solicitado');
      const slots = await loadVideoSlots(orderId);
      console.log('✅ [useOrderVideoManagement] Refresh concluído:', slots.length, 'slots');
      
      // Forçar re-render do hook base
      return slots;
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
      await baseHook.handleUpload(slotPosition, file, videoTitle || file.name);
      
      console.log('✅ [useOrderVideoManagement] Upload concluído com sucesso');
      setVideoName(videoTitle || file.name);
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

  // Wrapper para remoção
  const removeVideo = async (slotId: string) => {
    console.log('🗑️ [useOrderVideoManagement] Removendo vídeo:', { slotId });
    
    try {
      await baseHook.handleRemove(slotId);
      console.log('✅ [useOrderVideoManagement] Vídeo removido com sucesso');
      
    } catch (error) {
      console.error('❌ [useOrderVideoManagement] Erro na remoção:', error);
      throw error;
    }
  };

  const hideSuccess = () => {
    console.log('✅ [useOrderVideoManagement] Fechando popup de sucesso');
    setIsSuccessOpen(false);
  };

  return {
    // Estados de loading
    loading: loading || baseHook.uploading,
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
    hideSuccess,
    conflictModal
  };
};
