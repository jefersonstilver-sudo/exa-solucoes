
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
}

export const checkVideoHealth = async (videoUrl: string, videoId: string): Promise<VideoHealthCheck> => {
  console.log('🔍 Iniciando verificação de saúde do vídeo:', { videoId, videoUrl });
  
  const result: VideoHealthCheck = {
    videoId,
    url: videoUrl,
    urlValid: false,
    fileExists: false,
    fileAccessible: false,
    suggestions: []
  };

  try {
    // 1. Verificar se a URL é válida
    try {
      new URL(videoUrl);
      result.urlValid = true;
      console.log('✅ URL é válida:', videoUrl);
    } catch {
      result.urlValid = false;
      result.errorDetails = 'URL malformada';
      result.suggestions.push('Gerar nova URL para o arquivo');
      console.error('❌ URL inválida:', videoUrl);
      return result;
    }

    // 2. Verificar se é uma URL do Supabase Storage
    const isSupabaseUrl = videoUrl.includes('supabase.co/storage/v1/object/public/videos/');
    if (!isSupabaseUrl) {
      result.errorDetails = 'URL não é do Supabase Storage';
      result.suggestions.push('Verificar se o arquivo foi enviado corretamente');
      console.warn('⚠️ URL não é do Supabase Storage:', videoUrl);
    }

    // 3. Testar conectividade HTTP
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout
      
      console.log('🌐 Testando conectividade HTTP...');
      const response = await fetch(videoUrl, { 
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        result.fileExists = true;
        result.fileAccessible = true;
        console.log('✅ Arquivo acessível via HTTP:', response.status);
        
        // Verificar tipo de conteúdo
        const contentType = response.headers.get('content-type');
        if (contentType && !contentType.startsWith('video/')) {
          result.suggestions.push(`Tipo de arquivo inesperado: ${contentType}`);
        }
        
        // Verificar tamanho
        const contentLength = response.headers.get('content-length');
        if (contentLength) {
          const sizeInMB = parseInt(contentLength) / (1024 * 1024);
          console.log(`📦 Tamanho do arquivo: ${sizeInMB.toFixed(2)} MB`);
        }
        
      } else {
        result.fileExists = false;
        result.fileAccessible = false;
        result.errorDetails = `HTTP ${response.status} - ${response.statusText}`;
        console.error('❌ Erro HTTP:', response.status, response.statusText);
        
        if (response.status === 404) {
          result.suggestions.push('Arquivo não encontrado no storage');
        } else if (response.status === 403) {
          result.suggestions.push('Problema de permissão - verificar políticas RLS');
        } else {
          result.suggestions.push('Erro no servidor - tentar novamente mais tarde');
        }
      }
    } catch (error) {
      result.fileAccessible = false;
      if (error.name === 'AbortError') {
        result.errorDetails = 'Timeout na conexão (>10s)';
        result.suggestions.push('Conexão muito lenta ou arquivo muito grande');
      } else {
        result.errorDetails = `Erro de rede: ${error.message}`;
        result.suggestions.push('Verificar conectividade com a internet');
      }
      console.error('❌ Erro ao testar conectividade:', error);
    }

    // 4. Verificar se o arquivo existe no storage via API do Supabase
    if (isSupabaseUrl) {
      try {
        console.log('🔍 Verificando no Supabase Storage...');
        const urlParts = videoUrl.split('/storage/v1/object/public/videos/');
        if (urlParts.length === 2) {
          const filePath = urlParts[1];
          console.log('📁 Caminho do arquivo:', filePath);
          
          const { data, error } = await supabase.storage
            .from('videos')
            .list(filePath.split('/').slice(0, -1).join('/') || '', {
              search: filePath.split('/').pop()
            });
          
          if (error) {
            console.error('❌ Erro ao listar arquivos:', error);
            result.suggestions.push('Erro ao acessar bucket de vídeos');
          } else if (data && data.length > 0) {
            console.log('✅ Arquivo encontrado no storage:', data[0]);
            result.fileExists = true;
          } else {
            console.log('❌ Arquivo não encontrado no storage');
            result.suggestions.push('Arquivo foi deletado do storage');
          }
        }
      } catch (error) {
        console.error('❌ Erro ao verificar storage:', error);
        result.suggestions.push('Erro ao verificar storage do Supabase');
      }
    }

  } catch (error) {
    result.errorDetails = `Erro geral: ${error.message}`;
    result.suggestions.push('Erro inesperado na verificação');
    console.error('❌ Erro geral na verificação:', error);
  }

  // Adicionar sugestões baseadas no resultado
  if (!result.fileAccessible && result.urlValid) {
    result.suggestions.push('Tentar reenviar o vídeo');
    result.suggestions.push('Verificar configurações do bucket');
  }

  console.log('📊 Resultado da verificação:', result);
  return result;
};

export const diagnosePanelVideoIssues = async (orderId: string): Promise<VideoHealthCheck[]> => {
  console.log('🔍 Diagnosticando vídeos do pedido:', orderId);
  
  try {
    // Buscar todos os vídeos do pedido
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
      console.error('❌ Erro ao buscar vídeos do pedido:', error);
      throw error;
    }

    if (!pedidoVideos || pedidoVideos.length === 0) {
      console.log('ℹ️ Nenhum vídeo encontrado para o pedido');
      return [];
    }

    console.log(`📊 Encontrados ${pedidoVideos.length} vídeos para diagnóstico`);

    // Verificar saúde de cada vídeo
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
            suggestions: ['Verificar integridade do banco de dados']
          } as VideoHealthCheck;
        }
      })
    );

    return healthChecks;
  } catch (error) {
    console.error('❌ Erro ao diagnosticar vídeos:', error);
    throw error;
  }
};

export const testStorageConnectivity = async (): Promise<boolean> => {
  try {
    console.log('🔍 Testando conectividade com o storage...');
    
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Erro ao listar buckets:', bucketsError);
      return false;
    }
    
    const videosBucket = buckets?.find(bucket => bucket.name === 'videos');
    if (!videosBucket) {
      console.error('❌ Bucket "videos" não encontrado');
      return false;
    }
    
    console.log('✅ Conectividade com storage OK - Bucket videos encontrado');
    return true;
  } catch (error) {
    console.error('❌ Erro ao testar conectividade:', error);
    return false;
  }
};
