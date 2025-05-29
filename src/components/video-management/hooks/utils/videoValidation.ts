
export const isValidVideoUrl = (url: string) => {
  console.log('🔍 [VALIDATION] Validando URL:', url);
  
  // Verificar se URL não está vazia ou é pendente
  if (!url || url === 'pending_upload' || url.trim() === '') {
    console.log('❌ [VALIDATION] URL inválida ou vazia:', url);
    return false;
  }

  // Verificar se é uma URL válida
  try {
    const urlObj = new URL(url);
    
    // CORREÇÃO: Aceitar especificamente URLs do Supabase Storage
    const isSupabaseStorage = url.includes('supabase.co/storage/v1/object/public/');
    const isHttps = urlObj.protocol === 'https:';
    const hasVideoExtension = /\.(mp4|webm|ogg|avi|mov|mkv|m4v)(\?.*)?$/i.test(url);
    
    // Log detalhado para debug
    console.log('🔍 [VALIDATION] Análise da URL:', {
      url,
      isSupabaseStorage,
      isHttps,
      hasVideoExtension,
      domain: urlObj.hostname,
      pathname: urlObj.pathname
    });
    
    if (isSupabaseStorage && isHttps) {
      console.log('✅ [VALIDATION] URL válida do Supabase Storage:', url);
      return true;
    }
    
    if (isHttps && hasVideoExtension) {
      console.log('✅ [VALIDATION] URL de vídeo válida:', url);
      return true;
    }
    
    // FALLBACK: Se for HTTPS e do domínio Supabase, considerar válida mesmo sem extensão
    if (isHttps && url.includes('supabase.co') && url.includes('storage')) {
      console.log('✅ [VALIDATION] URL Supabase aceita (fallback):', url);
      return true;
    }
    
    console.log('⚠️ [VALIDATION] URL não reconhecida como vídeo válido:', {
      url,
      isSupabaseStorage,
      isHttps,
      hasVideoExtension
    });
    return false;
    
  } catch (error) {
    console.log('❌ [VALIDATION] URL malformada:', url, error);
    return false;
  }
};
