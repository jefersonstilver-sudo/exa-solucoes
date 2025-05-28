
import { supabase } from '@/integrations/supabase/client';
import { prepareForInsert } from '@/utils/supabaseUtils';

export interface VideoUploadData {
  file: File;
  userId: string;
  orderId: string;
  duration: number;
  orientation: 'landscape' | 'portrait';
}

export const uploadVideoToSupabase = async (data: VideoUploadData): Promise<string> => {
  const { file, userId, orderId, duration, orientation } = data;

  // Validar usando a função do Supabase (sem verificação de áudio)
  const { data: validationResult, error: validationError } = await supabase
    .rpc('validate_video_specs', {
      p_duracao: duration,
      p_orientacao: orientation === 'landscape' ? 'horizontal' : 'vertical',
      p_tem_audio: false, // Sempre false, áudio será mutado na reprodução
      p_largura: 1920,
      p_altura: 1080
    });

  if (validationError) throw validationError;

  if (!validationResult[0]?.valid) {
    const errors = validationResult[0]?.errors || ['Vídeo não atende aos requisitos'];
    throw new Error(errors.join(', '));
  }

  // Criar registro do vídeo
  const videoData = prepareForInsert({
    client_id: userId,
    nome: file.name,
    url: 'pending_upload',
    origem: 'cliente',
    duracao: duration,
    status: 'ativo',
    orientacao: orientation === 'landscape' ? 'horizontal' : 'vertical',
    tem_audio: false, // Sempre false para garantir que seja mutado
    largura: 1920,
    altura: 1080,
    tamanho_arquivo: file.size,
    formato: file.type
  });

  const { data: newVideo, error: videoInsertError } = await supabase
    .from('videos')
    .insert([videoData] as any)
    .select()
    .single();

  if (videoInsertError) throw videoInsertError;

  // Criar entrada na tabela pedido_videos para aprovação
  const { error: pedidoVideoError } = await supabase
    .from('pedido_videos')
    .insert({
      pedido_id: orderId,
      video_id: newVideo.id,
      slot_position: 1,
      approval_status: 'pending'
    });

  if (pedidoVideoError) throw pedidoVideoError;

  return newVideo.id;
};
