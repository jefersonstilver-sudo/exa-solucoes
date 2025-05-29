
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
    console.log('User ID:', userId);
    console.log('Order ID:', orderId);

    // Testar conectividade primeiro
    const isConnected = await testStorageConnectivity();
    if (!isConnected) {
      throw new Error('Não foi possível conectar ao storage. Verifique a configuração.');
    }

    // Validar vídeo
    const validation = await validateVideoFile(file);
    if (!validation.valid) {
      console.error('Validação falhou:', validation.errors);
      toast.error(validation.errors.join(', '));
      return false;
    }

    console.log('Vídeo validado com sucesso:', validation.metadata);
    onProgress?.(20);

    // Upload para storage com retry
    let videoUrl: string;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        videoUrl = await uploadVideoToStorage(file, userId, (progress) => {
          onProgress?.(20 + (progress * 0.6));
        });
        console.log('Upload para storage concluído, URL:', videoUrl);
        break;
      } catch (uploadError) {
        retryCount++;
        console.warn(`Tentativa ${retryCount} de upload falhou:`, uploadError);
        
        if (retryCount >= maxRetries) {
          throw new Error(`Upload falhou após ${maxRetries} tentativas: ${uploadError.message}`);
        }
        
        // Aguardar antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }

    onProgress?.(85);

    // Criar registro do vídeo com validação
    const videoData = {
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
    };

    console.log('Criando registro de vídeo:', videoData);

    const { data: videoRecord, error: videoError } = await supabase
      .from('videos')
      .insert(videoData)
      .select()
      .single();

    if (videoError) {
      console.error('Erro ao criar registro de vídeo:', videoError);
      throw new Error(`Erro ao salvar vídeo no banco: ${videoError.message}`);
    }

    console.log('Registro de vídeo criado com sucesso:', videoRecord);
    onProgress?.(95);

    // Verificar se já existe entrada para este slot
    const { data: existingSlot, error: checkError } = await supabase
      .from('pedido_videos')
      .select('id')
      .eq('pedido_id', orderId)
      .eq('slot_position', slotPosition)
      .maybeSingle();

    if (checkError) {
      console.error('Erro ao verificar slot existente:', checkError);
    }

    let slotResult;
    if (existingSlot) {
      // Atualizar entrada existente
      console.log('Atualizando slot existente:', existingSlot.id);
      const { error: updateError } = await supabase
        .from('pedido_videos')
        .update({
          video_id: videoRecord.id,
          approval_status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSlot.id);

      if (updateError) {
        console.error('Erro ao atualizar slot:', updateError);
        throw new Error(`Erro ao atualizar slot: ${updateError.message}`);
      }
      slotResult = { error: null };
    } else {
      // Criar nova entrada
      console.log('Criando nova entrada no slot');
      const { error: insertError } = await supabase
        .from('pedido_videos')
        .insert({
          pedido_id: orderId,
          video_id: videoRecord.id,
          slot_position: slotPosition,
          approval_status: 'pending',
          selected_for_display: false // Será definido pelo usuário posteriormente
        });

      slotResult = { error: insertError };
    }

    if (slotResult.error) {
      console.error('Erro ao gerenciar slot:', slotResult.error);
      throw new Error(`Erro ao salvar no slot: ${slotResult.error.message}`);
    }

    onProgress?.(100);
    console.log('Upload completo com sucesso!');
    toast.success('Vídeo enviado com sucesso!');
    return true;

  } catch (error) {
    console.error('Erro no upload:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    toast.error(`Erro ao fazer upload do vídeo: ${errorMessage}`);
    return false;
  }
};
