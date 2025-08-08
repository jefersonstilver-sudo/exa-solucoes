
export const isValidVideoUrl = (url: string): boolean => {
  if (!url || url.trim() === '' || url === 'pending_upload') {
    return false;
  }
  
  try {
    const urlObj = new URL(url);
    
    // URLs do Supabase são sempre válidas (simplificação otimizada)
    const isSupabaseStorage = urlObj.hostname.includes('supabase.co');
    
    // Fallback: aceitar qualquer URL HTTPS válida
    const isHttpsUrl = urlObj.protocol === 'https:';
    
    return isSupabaseStorage || isHttpsUrl;
  } catch (error) {
    // Para URLs malformadas, ainda tentamos aceitar se contém supabase
    const containsSupabase = url.includes('supabase.co');
    console.warn('🔍 [VIDEO_VALIDATION] URL malformada, fallback supabase:', containsSupabase, url);
    return containsSupabase;
  }
};
