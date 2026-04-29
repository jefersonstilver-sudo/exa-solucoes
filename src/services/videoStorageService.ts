
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

/**
 * Upload de vídeo para o Storage com progresso REAL via TUS (resumable).
 * Cai em fallback para o upload padrão somente se TUS falhar na inicialização.
 *
 * onProgress recebe valores de 0–100 baseados em bytes realmente enviados.
 */
export const uploadVideoToStorage = async (
  file: File,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  console.log('🚀 [Storage] Iniciando upload TUS:', file.name, `${(file.size / 1024 / 1024).toFixed(2)}MB`);

  // Nome final no storage
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fileName = `${timestamp}_${sanitizedName}`;
  const filePath = `${userId}/${fileName}`;

  // Tenta TUS primeiro (progresso real). Fallback: supabase.storage.upload.
  try {
    const url = await tusUploadToSupabase(file, filePath, onProgress);
    console.log('✅ [Storage] Upload TUS concluído:', url);
    return url;
  } catch (tusError: any) {
    console.warn('⚠️ [Storage] TUS falhou, caindo em fallback:', tusError?.message || tusError);
  }

  // Fallback: upload padrão (sem progresso real, mas garante envio)
  if (onProgress) onProgress(5);
  const { data, error } = await supabase.storage
    .from('videos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'video/mp4',
    });

  if (error) {
    console.error('❌ [Storage] Fallback upload falhou:', error);
    if (error.message.includes('Bucket not found')) {
      throw new Error('Storage não configurado. Contate o suporte técnico.');
    } else if (error.message.includes('Row level security')) {
      throw new Error('Erro de permissão. Faça login novamente.');
    } else if (error.message.includes('File size')) {
      throw new Error('Arquivo muito grande. Máximo 100MB.');
    } else if (error.message.includes('duplicate')) {
      throw new Error('Arquivo já existe. Tente novamente.');
    }
    throw new Error(`Falha no upload: ${error.message}`);
  }

  const { data: urlData } = supabase.storage.from('videos').getPublicUrl(filePath);
  if (!urlData?.publicUrl) {
    throw new Error('Erro ao gerar URL pública do vídeo');
  }

  if (onProgress) onProgress(100);
  return urlData.publicUrl;
};

/**
 * Upload via protocolo TUS direto ao endpoint resumível do Supabase Storage.
 * Reporta progresso real (0–100) baseado em bytes enviados.
 */
const tusUploadToSupabase = async (
  file: File,
  filePath: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const tus = await import('tus-js-client');

  // URL do projeto e token de acesso da sessão
  // Acessamos via cliente exposto (mesmo projeto)
  const SUPABASE_URL = (supabase as any).supabaseUrl as string;
  const ANON_KEY = (supabase as any).supabaseKey as string;

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;
  if (!accessToken) {
    throw new Error('Sem sessão autenticada para upload TUS');
  }

  return await new Promise<string>((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: `${SUPABASE_URL}/storage/v1/upload/resumable`,
      retryDelays: [0, 1500, 3000, 6000],
      headers: {
        authorization: `Bearer ${accessToken}`,
        'x-upsert': 'false',
        apikey: ANON_KEY,
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: 'videos',
        objectName: filePath,
        contentType: file.type || 'video/mp4',
        cacheControl: '3600',
      },
      // Chunk maior para conexões móveis estáveis
      chunkSize: 6 * 1024 * 1024,
      onError: (err) => reject(err),
      onProgress: (bytesUploaded: number, bytesTotal: number) => {
        if (!onProgress || !bytesTotal) return;
        // Reservamos os últimos 5% para "salvando registro"
        const pct = Math.min(95, Math.floor((bytesUploaded / bytesTotal) * 95));
        onProgress(pct);
      },
      onSuccess: () => {
        const { data: urlData } = supabase.storage.from('videos').getPublicUrl(filePath);
        if (!urlData?.publicUrl) {
          reject(new Error('Falha ao obter URL pública após TUS'));
          return;
        }
        if (onProgress) onProgress(95);
        resolve(urlData.publicUrl);
      },
    });

    upload.start();
  });
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
