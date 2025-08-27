import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const setBaseVideo = async (slotId: string): Promise<boolean> => {
  try {
    console.log('⭐ [VIDEO_BASE] Definindo vídeo base (RPC):', slotId);

    const { data, error } = await supabase.rpc('set_base_video_enhanced', {
      p_pedido_video_id: slotId
    });

    if (error) {
      console.error('❌ [VIDEO_BASE] RPC erro (enhanced):', error);

      // Fallback: tentar função antiga (compatibilidade) em caso de erro (ex: read-only)
      const isReadOnly = (error as any)?.message && /read[- ]?only/i.test((error as any).message);
      try {
        const { data: legacyData, error: legacyError } = await supabase.rpc('set_base_video', {
          p_pedido_video_id: slotId
        });

        if (legacyError) {
          console.error('❌ [VIDEO_BASE] RPC erro (legacy):', legacyError);
          toast.error('❌ Erro ao definir vídeo principal');
          return false;
        }

        if (legacyData === true) {
          console.warn('⚠️ [VIDEO_BASE] Usando fallback set_base_video devido a falha na enhanced', { isReadOnly });
          toast.success('✅ Vídeo definido como principal!');
          return true;
        }

        toast.error('❌ Erro ao definir vídeo principal');
        return false;
      } catch (fallbackErr) {
        console.error('💥 [VIDEO_BASE] Fallback falhou:', fallbackErr);
        toast.error('❌ Erro ao definir vídeo principal');
        return false;
      }
    }

    const result = data as any;

    if (!result?.success) {
      console.error('❌ [VIDEO_BASE] Falha lógica na RPC:', result);
      toast.error(`❌ ${result?.error || 'Não foi possível definir o vídeo como principal'}`);
      return false;
    }

    console.log('✅ [VIDEO_BASE] Vídeo base definido via RPC:', result);

    const slot = result?.new_base_slot ? `Slot ${result.new_base_slot}` : 'Vídeo';
    if (result?.schedules_deactivated) {
      toast.success(`✅ ${slot} definido como principal! Agendamentos desativados automaticamente.`);
    } else {
      toast.success(`✅ ${slot} definido como principal!`);
    }

    return true;
  } catch (error) {
    console.error('💥 [VIDEO_BASE] Erro geral:', error);
    toast.error('❌ Erro ao definir vídeo principal');
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