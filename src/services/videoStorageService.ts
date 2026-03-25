
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface VideoValidationResult {
  valid: boolean;
  errors: string[];
  needsTrimming?: boolean;
  maxDuration?: number;
  metadata: {
    duration: number;
    width: number;
    height: number;
    orientation: 'horizontal' | 'vertical';
    size: number;
    format: string;
  };
}

export const validateVideoFile = (file: File, tipo: 'horizontal' | 'vertical' = 'horizontal'): Promise<VideoValidationResult> => {
  return new Promise((resolve) => {
    console.log('🔍 Iniciando validação do arquivo:', file.name, 'Tamanho:', file.size, 'Tipo:', tipo);
    
    const METADATA_TIMEOUT_MS = 5000;
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    let resolved = false;

    // Defaults por tipo de produto
    const expectedOrientation = tipo === 'vertical' ? 'vertical' : 'horizontal';
    const defaultMaxDuration = tipo === 'vertical' ? 15 : 10;

    const clearAll = () => {
      try {
        video.removeAttribute('src');
        video.load();
      } catch {}
      URL.revokeObjectURL(url);
    };

    const finalize = (result: VideoValidationResult) => {
      if (resolved) return;
      resolved = true;
      clearAll();
      resolve(result);
    };

    // Fallback rápido caso metadados não carreguem a tempo
    const timeoutId = window.setTimeout(() => {
      console.warn('⏱️ [VALIDATION] Timeout ao carregar metadados. Usando validação rápida.');
      const allowedTypes = ['video/mp4', 'video/quicktime', 'video/avi', 'video/mov'];
      const isTypeOk = allowedTypes.includes(file.type);
      const isSizeOk = file.size <= 100 * 1024 * 1024;

      const errors: string[] = [];
      if (!isTypeOk) errors.push('Formato deve ser MP4, MOV ou AVI');
      if (!isSizeOk) errors.push('Arquivo deve ter no máximo 100MB');

      finalize({
        valid: isTypeOk && isSizeOk,
        errors,
        metadata: {
          duration: 0,
          width: 0,
          height: 0,
          orientation: expectedOrientation,
          size: file.size,
          format: file.type
        }
      });
    }, METADATA_TIMEOUT_MS);
    
    video.onloadedmetadata = () => {
      window.clearTimeout(timeoutId);
      const duration = Math.round(video.duration);
      const width = video.videoWidth;
      const height = video.videoHeight;
      const orientation = height > width ? 'vertical' : 'horizontal';
      const errors: string[] = [];
      
      console.log('📊 Metadados do vídeo:', { duration, width, height, orientation, tipoEsperado: tipo });
      
      // Duração máxima dinâmica baseada no tipo
      const maxDuration = defaultMaxDuration;
      const durationExceeded = duration > maxDuration;
      
      // Validação de orientação dinâmica baseada no tipo de produto
      if (orientation !== expectedOrientation) {
        errors.push(`Vídeo deve estar em orientação ${expectedOrientation === 'vertical' ? 'vertical (9:16)' : 'horizontal (4:3)'}`);
      }
      
      if (file.size > 100 * 1024 * 1024) {
        errors.push('Vídeo deve ter no máximo 100MB');
      }

      // Se só excedeu duração (sem outros erros), sinaliza para trimming
      if (durationExceeded && errors.length === 0) {
        finalize({
          valid: false,
          errors: [],
          needsTrimming: true,
          maxDuration,
          metadata: { duration, width, height, orientation, size: file.size, format: file.type }
        });
        return;
      }

      // Se excedeu duração E tem outros erros, adiciona o erro de duração também
      if (durationExceeded) {
        errors.push(`Vídeo deve ter no máximo ${maxDuration} segundos`);
      }
      
      finalize({
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
      window.clearTimeout(timeoutId);
      console.error('❌ Erro ao processar vídeo:', e);
      finalize({
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
    console.log('🚀 Iniciando upload do vídeo para storage:', file.name);
    console.log('📦 Tamanho do arquivo:', file.size, 'bytes');
    
    // Simular progresso inicial
    if (onProgress) onProgress(10);
    
    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'mp4';
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedName}`;
    const filePath = `${userId}/${fileName}`;
    
    console.log('📁 Caminho do arquivo:', filePath);
    
    if (onProgress) onProgress(20);
    
    // Tentar upload direto (removendo dependência do teste de conectividade que estava falhando)
    console.log('⬆️ Iniciando upload para bucket videos...');
    
    const { data, error } = await supabase.storage
      .from('videos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      });
    
    if (error) {
      console.error('❌ Erro detalhado no upload:', error);
      
      // Tratar erros específicos com mensagens mais claras
      if (error.message.includes('Bucket not found')) {
        throw new Error('Storage não configurado. Contate o suporte técnico.');
      } else if (error.message.includes('Row level security')) {
        throw new Error('Erro de permissão. Faça login novamente.');
      } else if (error.message.includes('File size')) {
        throw new Error('Arquivo muito grande. Máximo 100MB.');
      } else if (error.message.includes('duplicate')) {
        throw new Error('Arquivo já existe. Tente novamente.');
      } else {
        throw new Error(`Falha no upload: ${error.message}`);
      }
    }
    
    console.log('✅ Upload realizado com sucesso:', data);
    
    if (onProgress) onProgress(80);
    
    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from('videos')
      .getPublicUrl(filePath);
    
    if (!urlData || !urlData.publicUrl) {
      throw new Error('Erro ao gerar URL pública do vídeo');
    }
    
    console.log('🔗 URL pública gerada:', urlData.publicUrl);
    
    if (onProgress) onProgress(95);
    
    // Validar URL com timeout reduzido e sem falhar se não conseguir
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 segundos timeout
      
      const response = await fetch(urlData.publicUrl, { 
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log('✅ URL validada com sucesso');
      } else {
        console.warn('⚠️ URL pode não estar acessível ainda, mas continuando...');
      }
    } catch (urlError) {
      console.warn('⚠️ Não foi possível validar URL (não crítico):', urlError);
      // Não falhar aqui, a URL provavelmente está válida
    }
    
    if (onProgress) onProgress(100);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('💥 Erro no upload para storage:', error);
    throw error;
  }
};

export const deleteVideoFromStorage = async (videoUrl: string): Promise<void> => {
  try {
    console.log('🗑️ Deletando vídeo:', videoUrl);
    
    // Extrair o path do arquivo da URL
    const urlParts = videoUrl.split('/storage/v1/object/public/videos/');
    if (urlParts.length < 2) {
      console.log('⚠️ URL não é do storage, pulando deleção');
      return;
    }
    
    const filePath = urlParts[1];
    console.log('📁 Caminho do arquivo para deleção:', filePath);
    
    const { error } = await supabase.storage
      .from('videos')
      .remove([filePath]);
    
    if (error) {
      console.error('❌ Erro ao deletar do storage:', error);
      throw error;
    }
    
    console.log('✅ Arquivo deletado com sucesso do storage');
  } catch (error) {
    console.error('❌ Erro ao deletar vídeo do storage:', error);
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

// Função para testar conectividade com o storage (melhorada)
export const testStorageConnectivity = async (): Promise<boolean> => {
  try {
    console.log('🔍 Testando conectividade com storage...');
    
    // Tentar listar buckets
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
      console.error('❌ Erro ao listar buckets:', error);
      return false;
    }
    
    console.log('📦 Buckets encontrados:', data?.map(b => b.name));
    
    // Verificar se bucket videos existe
    const videosBucket = data?.find(bucket => bucket.name === 'videos');
    if (!videosBucket) {
      console.error('❌ Bucket "videos" não encontrado');
      return false;
    }
    
    // Tentar listar arquivos no bucket para confirmar acesso
    try {
      const { error: listError } = await supabase.storage
        .from('videos')
        .list('', { limit: 1 });
      
      if (listError) {
        console.error('❌ Erro ao acessar bucket videos:', listError);
        return false;
      }
      
      console.log('✅ Conectividade com storage OK - Bucket videos acessível');
      return true;
    } catch (listError) {
      console.error('❌ Erro ao testar acesso ao bucket:', listError);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao testar conectividade:', error);
    return false;
  }
};

// Função para criar bucket se não existir (simplificada)
export const ensureVideosBucket = async (): Promise<boolean> => {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const videosBucket = buckets?.find(bucket => bucket.name === 'videos');
    
    if (videosBucket) {
      console.log('✅ Bucket videos já existe');
      return true;
    }
    
    console.log('⚠️ Bucket videos não encontrado - pode precisar ser criado pelo administrador');
    return false;
  } catch (error) {
    console.error('❌ Erro ao verificar bucket:', error);
    return false;
  }
};

// Nova função para limpar registros órfãos
export const cleanupPendingUploads = async (userId: string): Promise<number> => {
  try {
    console.log('🧹 Limpando uploads pendentes para usuário:', userId);
    
    // Buscar vídeos com URL pending_upload
    const { data: pendingVideos, error: selectError } = await supabase
      .from('videos')
      .select('id, nome, url')
      .eq('client_id', userId)
      .eq('url', 'pending_upload');
    
    if (selectError) {
      console.error('❌ Erro ao buscar vídeos pendentes:', selectError);
      return 0;
    }
    
    if (!pendingVideos || pendingVideos.length === 0) {
      console.log('ℹ️ Nenhum vídeo pendente encontrado');
      return 0;
    }
    
    console.log(`🗑️ Removendo ${pendingVideos.length} vídeos pendentes`);
    
    // Deletar vídeos pendentes
    const { error: deleteError } = await supabase
      .from('videos')
      .delete()
      .eq('client_id', userId)
      .eq('url', 'pending_upload');
    
    if (deleteError) {
      console.error('❌ Erro ao deletar vídeos pendentes:', deleteError);
      return 0;
    }
    
    // Limpar também entradas órfãs da tabela pedido_videos
    const { error: cleanupError } = await supabase
      .from('pedido_videos')
      .delete()
      .in('video_id', pendingVideos.map(v => v.id));
    
    if (cleanupError) {
      console.warn('⚠️ Erro ao limpar pedido_videos órfãos:', cleanupError);
    }
    
    console.log(`✅ Limpeza concluída: ${pendingVideos.length} registros removidos`);
    return pendingVideos.length;
  } catch (error) {
    console.error('❌ Erro na limpeza de uploads pendentes:', error);
    return 0;
  }
};
