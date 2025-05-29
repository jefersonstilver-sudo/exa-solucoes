
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface VideoValidationResult {
  valid: boolean;
  errors: string[];
  metadata: {
    duration: number;
    width: number;
    height: number;
    orientation: 'horizontal' | 'vertical';
    size: number;
    format: string;
  };
}

export const validateVideoFile = (file: File): Promise<VideoValidationResult> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    
    video.onloadedmetadata = () => {
      const duration = Math.round(video.duration);
      const width = video.videoWidth;
      const height = video.videoHeight;
      const orientation = height > width ? 'vertical' : 'horizontal';
      const errors: string[] = [];
      
      // Validações
      if (duration > 15) {
        errors.push('Vídeo deve ter no máximo 15 segundos');
      }
      
      if (orientation !== 'horizontal') {
        errors.push('Vídeo deve estar em orientação horizontal');
      }
      
      if (file.size > 100 * 1024 * 1024) { // 100MB
        errors.push('Vídeo deve ter no máximo 100MB');
      }
      
      URL.revokeObjectURL(url);
      
      resolve({
        valid: errors.length === 0,
        errors,
        metadata: {
          duration,
          width,
          height,
          orientation,
          size: file.size,
          format: file.type
        }
      });
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({
        valid: false,
        errors: ['Erro ao processar vídeo'],
        metadata: {
          duration: 0,
          width: 0,
          height: 0,
          orientation: 'horizontal',
          size: file.size,
          format: file.type
        }
      });
    };
    
    video.src = url;
  });
};

export const uploadVideoToStorage = async (
  file: File, 
  userId: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = `${userId}/${fileName}`;
    
    // Simular progresso se callback fornecido
    if (onProgress) onProgress(10);
    
    // Upload para o storage
    const { data, error } = await supabase.storage
      .from('videos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) throw error;
    if (onProgress) onProgress(80);
    
    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from('videos')
      .getPublicUrl(filePath);
    
    if (onProgress) onProgress(100);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('Erro no upload:', error);
    throw new Error('Erro ao fazer upload do vídeo');
  }
};

export const deleteVideoFromStorage = async (videoUrl: string): Promise<void> => {
  try {
    // Extrair o path do arquivo da URL
    const urlParts = videoUrl.split('/storage/v1/object/public/videos/');
    if (urlParts.length < 2) return;
    
    const filePath = urlParts[1];
    
    const { error } = await supabase.storage
      .from('videos')
      .remove([filePath]);
    
    if (error) throw error;
  } catch (error) {
    console.error('Erro ao deletar vídeo do storage:', error);
    // Não falhar silenciosamente em caso de erro de deleção
  }
};
