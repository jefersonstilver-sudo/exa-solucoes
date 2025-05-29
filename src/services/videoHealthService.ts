import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface VideoHealthCheck {
  videoId: string;
  url: string;
  urlValid: boolean;
  fileExists: boolean;
  fileAccessible: boolean;
  errorDetails?: string;
  suggestions: string[];
  alascaSeteStatus?: 'ok' | 'warning' | 'error';
}

export const checkVideoHealth = async (videoUrl: string, videoId: string): Promise<VideoHealthCheck> => {
  console.log('🔍 [ALASCA SETE] Iniciando verificação de saúde do vídeo:', { videoId, videoUrl });
  
  const result: VideoHealthCheck = {
    videoId,
    url: videoUrl,
    urlValid: false,
    fileExists: false,
    fileAccessible: false,
    suggestions: [],
    alascaSeteStatus: 'error'
  };

  try {
    // 1. Verificar se a URL é válida
    try {
      new URL(videoUrl);
      result.urlValid = true;
      console.log('✅ [ALASCA SETE] URL é válida:', videoUrl);
    } catch {
      result.urlValid = false;
      result.errorDetails = 'URL malformada ou pendente';
      if (videoUrl === 'pending_upload') {
        result.suggestions.push('Upload não foi concluído - tentar enviar novamente');
      } else {
        result.suggestions.push('Gerar nova URL para o arquivo');
      }
      console.error('❌ [ALASCA SETE] URL inválida:', videoUrl);
      return result;
    }

    // 2. Verificar se é uma URL do Supabase Storage
    const isSupabaseUrl = videoUrl.includes('supabase.co/storage/v1/object/public/videos/');
    if (!isSupabaseUrl) {
      result.errorDetails = 'URL não é do Supabase Storage';
      result.suggestions.push('Verificar se o arquivo foi enviado corretamente');
      console.warn('⚠️ [ALASCA SETE] URL não é do Supabase Storage:', videoUrl);
    }

    // 3. Testar conectividade HTTP com timeout mais curto
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      console.log('🌐 [ALASCA SETE] Testando conectividade HTTP...');
      const response = await fetch(videoUrl, { 
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        result.fileExists = true;
        result.fileAccessible = true;
        result.alascaSeteStatus = 'ok';
        console.log('✅ [ALASCA SETE] Arquivo acessível via HTTP:', response.status);
        
        const contentType = response.headers.get('content-type');
        if (contentType && !contentType.startsWith('video/')) {
          result.suggestions.push(`Tipo de arquivo inesperado: ${contentType}`);
          result.alascaSeteStatus = 'warning';
        }
        
        const contentLength = response.headers.get('content-length');
        if (contentLength) {
          const sizeInMB = parseInt(contentLength) / (1024 * 1024);
          console.log(`📦 [ALASCA SETE] Tamanho do arquivo: ${sizeInMB.toFixed(2)} MB`);
        }
        
      } else {
        result.fileExists = false;
        result.fileAccessible = false;
        result.errorDetails = `HTTP ${response.status} - ${response.statusText}`;
        result.alascaSeteStatus = 'error';
        console.error('❌ [ALASCA SETE] Erro HTTP:', response.status, response.statusText);
        
        if (response.status === 404) {
          result.suggestions.push('Arquivo não encontrado no storage - reenviar vídeo');
        } else if (response.status === 403) {
          result.suggestions.push('Problema de permissão - verificar configuração');
        } else {
          result.suggestions.push('Erro no servidor - tentar novamente mais tarde');
        }
      }
    } catch (error) {
      result.fileAccessible = false;
      result.alascaSeteStatus = 'error';
      if (error.name === 'AbortError') {
        result.errorDetails = 'Timeout na conexão (>5s)';
        result.suggestions.push('Conexão muito lenta - verificar internet');
      } else {
        result.errorDetails = `Erro de rede: ${error.message}`;
        result.suggestions.push('Verificar conectividade com a internet');
      }
      console.error('❌ [ALASCA SETE] Erro ao testar conectividade:', error);
    }

    // 4. Verificar no storage via API
    if (isSupabaseUrl) {
      try {
        console.log('🔍 [ALASCA SETE] Verificando no Supabase Storage...');
        const urlParts = videoUrl.split('/storage/v1/object/public/videos/');
        if (urlParts.length === 2) {
          const filePath = urlParts[1];
          console.log('📁 [ALASCA SETE] Caminho do arquivo:', filePath);
          
          const pathSegments = filePath.split('/');
          const fileName = pathSegments.pop();
          const folderPath = pathSegments.join('/');
          
          const { data, error } = await supabase.storage
            .from('videos')
            .list(folderPath || '', {
              search: fileName
            });
          
          if (error) {
            console.error('❌ [ALASCA SETE] Erro ao listar arquivos:', error);
            result.suggestions.push('Erro ao acessar storage - verificar permissões');
          } else if (data && data.length > 0) {
            console.log('✅ [ALASCA SETE] Arquivo encontrado no storage:', data[0]);
            result.fileExists = true;
          } else {
            console.log('❌ [ALASCA SETE] Arquivo não encontrado no storage');
            result.suggestions.push('Arquivo foi deletado ou não foi enviado corretamente');
          }
        }
      } catch (error) {
        console.error('❌ [ALASCA SETE] Erro ao verificar storage:', error);
        result.suggestions.push('Erro ao verificar storage do Supabase');
      }
    }

  } catch (error) {
    result.errorDetails = `Erro geral: ${error.message}`;
    result.suggestions.push('Erro inesperado na verificação');
    result.alascaSeteStatus = 'error';
    console.error('❌ [ALASCA SETE] Erro geral na verificação:', error);
  }

  // Adicionar sugestões baseadas no resultado
  if (!result.fileAccessible && result.urlValid) {
    result.suggestions.push('Tentar reenviar o vídeo');
    result.suggestions.push('Usar a funcionalidade de limpeza de registros órfãos');
  }

  console.log('📊 [ALASCA SETE] Resultado da verificação:', result);
  return result;
};

export const diagnosePanelVideoIssues = async (orderId: string): Promise<VideoHealthCheck[]> => {
  console.log('🔍 [ALASCA SETE] Diagnosticando vídeos do pedido:', orderId);
  
  try {
    const { data: pedidoVideos, error } = await supabase
      .from('pedido_videos')
      .select(`
        id,
        video_id,
        slot_position,
        selected_for_display,
        videos (
          id,
          nome,
          url
        )
      `)
      .eq('pedido_id', orderId);

    if (error) {
      console.error('❌ [ALASCA SETE] Erro ao buscar vídeos do pedido:', error);
      throw error;
    }

    if (!pedidoVideos || pedidoVideos.length === 0) {
      console.log('ℹ️ [ALASCA SETE] Nenhum vídeo encontrado para o pedido');
      return [];
    }

    console.log(`📊 [ALASCA SETE] Encontrados ${pedidoVideos.length} vídeos para diagnóstico`);

    const healthChecks = await Promise.all(
      pedidoVideos.map(async (pv) => {
        if (pv.videos) {
          return await checkVideoHealth(pv.videos.url, pv.videos.id);
        } else {
          return {
            videoId: pv.video_id || 'unknown',
            url: 'N/A',
            urlValid: false,
            fileExists: false,
            fileAccessible: false,
            errorDetails: 'Vídeo não encontrado no banco',
            suggestions: ['Verificar integridade do banco de dados', 'Reenviar vídeo'],
            alascaSeteStatus: 'error'
          } as VideoHealthCheck;
        }
      })
    );

    return healthChecks;
  } catch (error) {
    console.error('❌ [ALASCA SETE] Erro ao diagnosticar vídeos:', error);
    throw error;
  }
};

export const testStorageConnectivity = async (): Promise<boolean> => {
  try {
    console.log('🔍 [ALASCA SETE] Testando conectividade com o storage...');
    
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ [ALASCA SETE] Erro ao listar buckets:', bucketsError);
      return false;
    }
    
    const videosBucket = buckets?.find(bucket => bucket.name === 'videos');
    if (!videosBucket) {
      console.error('❌ [ALASCA SETE] Bucket "videos" não encontrado');
      return false;
    }
    
    try {
      const { error: listError } = await supabase.storage
        .from('videos')
        .list('', { limit: 1 });
      
      if (listError) {
        console.error('❌ [ALASCA SETE] Erro ao acessar bucket videos:', listError);
        return false;
      }
      
      console.log('✅ [ALASCA SETE] Conectividade com storage OK - Bucket videos acessível');
      return true;
    } catch (listError) {
      console.error('❌ [ALASCA SETE] Erro ao testar acesso ao bucket:', listError);
      return false;
    }
  } catch (error) {
    console.error('❌ [ALASCA SETE] Erro ao testar conectividade:', error);
    return false;
  }
};
