import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const setBaseVideo = async (slotId: string): Promise<boolean> => {
  try {
    console.log('⭐ [VIDEO_BASE] Definindo vídeo base:', slotId);
    
    const { data, error } = await supabase.rpc('set_base_video_enhanced', {
      p_pedido_video_id: slotId
    });

    if (error) {
      console.error('❌ [VIDEO_BASE] Erro ao definir vídeo base:', error);
      throw error;
    }

    console.log('📋 [VIDEO_BASE] Resposta da função:', data);

    // Type guard para a resposta da função
    const response = data as { success?: boolean; schedules_deactivated?: boolean; new_base_slot?: number; error?: string } | null;

    if (response?.success) {
      console.log('✅ [VIDEO_BASE] Vídeo base definido com sucesso');
      
      if (response.schedules_deactivated) {
        toast.success(`✅ Vídeo do Slot ${response.new_base_slot} definido como principal! Agendamento desativado automaticamente.`);
      } else {
        toast.success(`✅ Vídeo do Slot ${response.new_base_slot} definido como principal!`);
      }
      
      return true;
    } else {
      console.error('❌ [VIDEO_BASE] Erro retornado pela função:', response?.error);
      toast.error(`❌ ${response?.error || 'Erro ao definir vídeo base'}`);
      return false;
    }
  } catch (error) {
    console.error('💥 [VIDEO_BASE] Erro geral:', error);
    toast.error('❌ Erro ao definir vídeo base');
    return false;
  }
};

export const getCurrentDisplayVideo = async (orderId: string) => {
  try {
    console.log('📺 [VIDEO_DISPLAY] Obtendo vídeo atual para exibição:', orderId);
    
    const { data, error } = await supabase.rpc('get_current_display_video', {
      p_pedido_id: orderId
    });

    if (error) {
      console.error('❌ [VIDEO_DISPLAY] Erro ao obter vídeo atual:', error);
      throw error;
    }

    console.log('✅ [VIDEO_DISPLAY] Vídeo atual obtido:', data);
    return data;
  } catch (error) {
    console.error('💥 [VIDEO_DISPLAY] Erro geral:', error);
    return null;
  }
};