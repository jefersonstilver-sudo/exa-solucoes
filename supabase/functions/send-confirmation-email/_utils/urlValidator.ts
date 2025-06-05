
export function validateAndCorrectUrl(url: string): string {
  try {
    // Remover qualquer ponto no início do hostname
    let correctedUrl = url.replace(/https?:\/\/\.+/, 'https://');
    
    // Verificar se é uma URL válida
    const urlObj = new URL(correctedUrl);
    
    // Se o hostname começar com ponto, corrigir
    if (urlObj.hostname.startsWith('.')) {
      urlObj.hostname = urlObj.hostname.substring(1);
      correctedUrl = urlObj.toString();
    }
    
    return correctedUrl;
  } catch (error) {
    console.error('❌ [URL-VALIDATION] URL inválida:', url, error);
    return url; // Retorna original se não conseguir corrigir
  }
}
