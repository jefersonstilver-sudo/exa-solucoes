
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
    
    // ACEITAR APENAS URLs do Supabase Storage
    const isSupabasePublic = url.includes('supabase.co/storage/v1/object/public/');
    const isSupabaseSign = url.includes('supabase.co/storage/v1/object/sign/');
    const isHttps = urlObj.protocol === 'https:';
    const isSupabaseDomain = urlObj.hostname.includes('supabase.co');
    
    // Log detalhado para debug
    console.log('🔍 [VALIDATION] Análise da URL:', {
      url,
      isSupabasePublic,
      isSupabaseSign,
      isHttps,
      isSupabaseDomain,
      domain: urlObj.hostname,
      pathname: urlObj.pathname
    });
    
    // Aceitar URLs públicas do Supabase Storage
    if (isSupabasePublic && isHttps && isSupabaseDomain) {
      console.log('✅ [VALIDATION] URL pública válida do Supabase Storage:', url);
      return true;
    }
    
    // Aceitar URLs assinadas do Supabase Storage (com token)
    if (isSupabaseSign && isHttps && isSupabaseDomain) {
      console.log('✅ [VALIDATION] URL assinada válida do Supabase Storage:', url);
      return true;
    }
    
    // FALLBACK: Qualquer URL do domínio Supabase com storage
    if (isHttps && isSupabaseDomain && url.includes('storage')) {
      console.log('✅ [VALIDATION] URL Supabase Storage aceita (fallback):', url);
      return true;
    }
    
    console.log('❌ [VALIDATION] URL rejeitada - apenas URLs do Supabase Storage são aceitas:', {
      url,
      isSupabasePublic,
      isSupabaseSign,
      isHttps,
      isSupabaseDomain
    });
    return false;
    
  } catch (error) {
    console.log('❌ [VALIDATION] URL malformada:', url, error);
    return false;
  }
};
