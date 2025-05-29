
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
    console.log('Iniciando validação do arquivo:', file.name, 'Tamanho:', file.size);
    
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    
    video.onloadedmetadata = () => {
      const duration = Math.round(video.duration);
      const width = video.videoWidth;
      const height = video.videoHeight;
      const orientation = height > width ? 'vertical' : 'horizontal';
      const errors: string[] = [];
      
      console.log('Metadados do vídeo:', { duration, width, height, orientation });
      
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
    
    video.onerror = (e) => {
      console.error('Erro ao processar vídeo:', e);
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
    console.log('=== INICIANDO UPLOAD DE VÍDEO ===');
    console.log('Arquivo:', file.name, 'Tamanho:', file.size, 'Tipo:', file.type);
    console.log('User ID:', userId);
    
    // Garantir que o bucket existe primeiro
    const bucketReady = await ensureVideosBucket();
    if (!bucketReady) {
      throw new Error('Não foi possível preparar o bucket de vídeos');
    }
    
    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'mp4';
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedName}`;
    const filePath = `${userId}/${fileName}`;
    
    console.log('Caminho do arquivo:', filePath);
    
    if (onProgress) onProgress(10);
    
    // Upload para o storage
    console.log('Iniciando upload para o storage...');
    const { data, error } = await supabase.storage
      .from('videos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      });
    
    if (error) {
      console.error('Erro no upload para storage:', error);
      throw new Error(`Erro no upload: ${error.message}`);
    }
    
    console.log('Upload realizado com sucesso:', data);
    if (onProgress) onProgress(60);
    
    // Obter URL pública
    console.log('Gerando URL pública...');
    const { data: urlData } = supabase.storage
      .from('videos')
      .getPublicUrl(filePath);
    
    if (!urlData || !urlData.publicUrl) {
      throw new Error('Erro ao gerar URL pública do vídeo');
    }
    
    console.log('URL pública gerada:', urlData.publicUrl);
    if (onProgress) onProgress(80);
    
    // Validar se a URL é acessível
    try {
      console.log('Validando URL...');
      const response = await fetch(urlData.publicUrl, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(10000) // 10 segundos timeout
      });
      
      if (!response.ok) {
        console.warn('URL pode não estar acessível ainda:', response.status);
      } else {
        console.log('URL validada com sucesso');
      }
    } catch (urlError) {
      console.warn('Erro ao validar URL (não crítico):', urlError);
    }
    
    if (onProgress) onProgress(100);
    
    console.log('=== UPLOAD CONCLUÍDO COM SUCESSO ===');
    console.log('URL final:', urlData.publicUrl);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('=== ERRO NO UPLOAD ===');
    console.error('Erro detalhado:', error);
    throw error;
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
  }
};

// Função utilitária para verificar se uma URL de vídeo é válida
export const isValidVideoUrl = (url: string): boolean => {
  if (!url || url === 'pending_upload' || url.trim() === '') {
    return false;
  }
  
  try {
    new URL(url);
    return url.includes('/storage/v1/object/public/videos/');
  } catch {
    return false;
  }
};

// Função para testar conectividade com o storage
export const testStorageConnectivity = async (): Promise<boolean> => {
  try {
    console.log('Testando conectividade com storage...');
    
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

// Função para criar bucket se não existir
export const ensureVideosBucket = async (): Promise<boolean> => {
  try {
    console.log('Verificando/criando bucket videos...');
    
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      console.error('Erro ao listar buckets:', listError);
      return false;
    }
    
    const videosBucket = buckets?.find(bucket => bucket.name === 'videos');
    
    if (!videosBucket) {
      console.log('Criando bucket videos...');
      const { error: createError } = await supabase.storage.createBucket('videos', {
        public: true,
        fileSizeLimit: 100 * 1024 * 1024, // 100MB
        allowedMimeTypes: ['video/mp4', 'video/quicktime', 'video/avi', 'video/mov']
      });
      
      if (createError) {
        console.error('Erro ao criar bucket:', createError);
        return false;
      }
      
      console.log('Bucket videos criado com sucesso');
    } else {
      console.log('Bucket videos já existe');
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao garantir bucket:', error);
    return false;
  }
};
