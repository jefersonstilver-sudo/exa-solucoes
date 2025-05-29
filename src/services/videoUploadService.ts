
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  validateVideoFile, 
  uploadVideoToStorage, 
  testStorageConnectivity 
} from '@/services/videoStorageService';

export const uploadVideo = async (
  slotPosition: number,
  file: File,
  userId: string,
  orderId: string,
  onProgress?: (progress: number) => void
): Promise<boolean> => {
  try {
    console.log(`Iniciando upload para slot ${slotPosition}:`, file.name);

    // Testar conectividade primeiro
    const isConnected = await testStorageConnectivity();
    if (!isConnected) {
      throw new Error('Não foi possível conectar ao storage. Verifique a configuração.');
    }

    // Validar vídeo
    const validation = await validateVideoFile(file);
    if (!validation.valid) {
      toast.error(validation.errors.join(', '));
      return false;
    }

    onProgress?.(20);

    // Upload para storage
    const videoUrl = await uploadVideoToStorage(file, userId, (progress) => {
      onProgress?.(20 + (progress * 0.6));
    });

    console.log('Vídeo uploaded, URL:', videoUrl);
    onProgress?.(90);

    // Criar registro do vídeo
    const { data: videoData, error: videoError } = await supabase
      .from('videos')
      .insert({
        client_id: userId,
        nome: file.name,
        url: videoUrl,
        origem: 'cliente',
        status: 'ativo',
        duracao: validation.metadata.duration,
        orientacao: validation.metadata.orientation,
        largura: validation.metadata.width,
        altura: validation.metadata.height,
        tamanho_arquivo: validation.metadata.size,
        formato: validation.metadata.format,
        tem_audio: false // Sempre false para garantir que seja mutado
      })
      .select()
      .single();

    if (videoError) throw videoError;

    console.log('Registro de vídeo criado:', videoData);

    // Criar/atualizar entrada na tabela pedido_videos
    const { error: slotError } = await supabase
      .from('pedido_videos')
      .upsert({
        pedido_id: orderId,
        video_id: videoData.id,
        slot_position: slotPosition,
        approval_status: 'pending'
      });

    if (slotError) throw slotError;

    onProgress?.(100);
    toast.success('Vídeo enviado com sucesso!');
    return true;
  } catch (error) {
    console.error('Erro no upload:', error);
    toast.error('Erro ao fazer upload do vídeo: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    return false;
  }
};
