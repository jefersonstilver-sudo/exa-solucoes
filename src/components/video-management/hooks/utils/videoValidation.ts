
export const isValidVideoUrl = (url: string) => {
  console.log('🔍 [PLAYER] Validando URL:', url);
  
  // Verificar se URL não está vazia ou é pendente
  if (!url || url === 'pending_upload' || url.trim() === '') {
    console.log('❌ [PLAYER] URL inválida ou vazia:', url);
    return false;
  }

  // Verificar se é uma URL válida
  try {
    const urlObj = new URL(url);
    
    // CORREÇÃO: Aceitar especificamente URLs do Supabase Storage
    const isSupabaseStorage = url.includes('supabase.co/storage/v1/object/public/');
    const isHttps = urlObj.protocol === 'https:';
    const hasVideoExtension = /\.(mp4|webm|ogg|avi|mov|mkv|m4v)(\?.*)?$/i.test(url);
    
    if (isSupabaseStorage && isHttps) {
      console.log('✅ [PLAYER] URL válida do Supabase Storage:', url);
      return true;
    }
    
    if (isHttps && hasVideoExtension) {
      console.log('✅ [PLAYER] URL de vídeo válida:', url);
      return true;
    }
    
    console.log('⚠️ [PLAYER] URL não reconhecida como vídeo válido:', {
      url,
      isSupabaseStorage,
      isHttps,
      hasVideoExtension
    });
    return false;
    
  } catch (error) {
    console.log('❌ [PLAYER] URL malformada:', url, error);
    return false;
  }
};
