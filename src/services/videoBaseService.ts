import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const setBaseVideo = async (slotId: string): Promise<boolean> => {
  try {
    console.log('⭐ [VIDEO_BASE] Definindo vídeo base:', slotId);
    
    const { data, error } = await supabase.rpc('set_base_video', {
      p_pedido_video_id: slotId
    });

    if (error) {
      console.error('❌ [VIDEO_BASE] Erro ao definir vídeo base:', error);
      throw error;
    }

    if (data) {
      console.log('✅ [VIDEO_BASE] Vídeo base definido com sucesso');
      toast.success('✅ Vídeo definido como base!');
      return true;
    } else {
      console.error('❌ [VIDEO_BASE] Função retornou falso - vídeo não aprovado?');
      toast.error('❌ Apenas vídeos aprovados podem ser definidos como base');
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