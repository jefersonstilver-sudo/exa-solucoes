import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Envia um vídeo manualmente para a API externa (AWS)
 */
export const resyncVideoToExternalAPI = async (pedidoVideoId: string): Promise<boolean> => {
  try {
    console.log('🔄 [RESYNC] Iniciando resync manual para:', pedidoVideoId);

    const { data, error } = await supabase.functions.invoke('upload-video-to-external-api', {
      body: { pedido_video_id: pedidoVideoId }
    });

    if (error) {
      console.error('❌ [RESYNC] Erro ao chamar edge function:', error);
      throw new Error(error.message || 'Erro ao sincronizar vídeo');
    }

    if (!data?.success) {
      console.error('❌ [RESYNC] Edge function retornou erro:', data);
      throw new Error(data?.error || 'Erro desconhecido ao sincronizar vídeo');
    }

    console.log('✅ [RESYNC] Vídeo sincronizado com sucesso:', data);
    toast.success('Vídeo reenviado para AWS com sucesso!');
    
    return true;
  } catch (error: any) {
    console.error('💥 [RESYNC] Erro crítico:', error);
    toast.error(`Erro ao reenviar vídeo: ${error.message}`);
    return false;
  }
};
