
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
    console.log('Iniciando upload do vídeo:', file.name);
    
    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = `${userId}/${fileName}`;
    
    console.log('Caminho do arquivo:', filePath);
    
    // Simular progresso se callback fornecido
    if (onProgress) onProgress(10);
    
    // Upload para o storage
    const { data, error } = await supabase.storage
      .from('videos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('Erro no upload:', error);
      throw error;
    }
    
    console.log('Upload realizado com sucesso:', data);
    
    if (onProgress) onProgress(80);
    
    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from('videos')
      .getPublicUrl(filePath);
    
    console.log('URL pública gerada:', urlData.publicUrl);
    
    if (onProgress) onProgress(100);
    
    // Validar se a URL é acessível
    try {
      const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
      if (!response.ok) {
        console.warn('URL pode não estar acessível:', response.status);
      } else {
        console.log('URL validada com sucesso');
      }
    } catch (urlError) {
      console.warn('Erro ao validar URL:', urlError);
    }
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('Erro no upload:', error);
    throw new Error('Erro ao fazer upload do vídeo');
  }
};

export const deleteVideoFromStorage = async (videoUrl: string): Promise<void> => {
  try {
    console.log('Deletando vídeo:', videoUrl);
    
    // Extrair o path do arquivo da URL
    const urlParts = videoUrl.split('/storage/v1/object/public/videos/');
    if (urlParts.length < 2) {
      console.log('URL não é do storage, pulando deleção');
      return;
    }
    
    const filePath = urlParts[1];
    console.log('Caminho do arquivo para deleção:', filePath);
    
    const { error } = await supabase.storage
      .from('videos')
      .remove([filePath]);
    
    if (error) {
      console.error('Erro ao deletar do storage:', error);
      throw error;
    }
    
    console.log('Arquivo deletado com sucesso do storage');
  } catch (error) {
    console.error('Erro ao deletar vídeo do storage:', error);
    // Não falhar silenciosamente - permitir que a operação continue
  }
};

// Função utilitária para verificar se uma URL de vídeo é válida
export const isValidVideoUrl = (url: string): boolean => {
  if (!url || url === 'pending_upload' || url.trim() === '') {
    return false;
  }
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Função para testar conectividade com o storage
export const testStorageConnectivity = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
      console.error('Erro ao listar buckets:', error);
      return false;
    }
    
    const videosBucket = data?.find(bucket => bucket.name === 'videos');
    if (!videosBucket) {
      console.error('Bucket "videos" não encontrado');
      return false;
    }
    
    console.log('Conectividade com storage OK - Bucket videos encontrado');
    return true;
  } catch (error) {
    console.error('Erro ao testar conectividade:', error);
    return false;
  }
};
