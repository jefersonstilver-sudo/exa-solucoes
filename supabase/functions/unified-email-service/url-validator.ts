
export class URLValidator {
  static validateAndCorrectUrl(url: string): string {
    try {
      let correctedUrl = url.replace(/https?:\/\/\.+/, 'https://');
      const urlObj = new URL(correctedUrl);
      
      if (urlObj.hostname.startsWith('.')) {
        urlObj.hostname = urlObj.hostname.substring(1);
        correctedUrl = urlObj.toString();
      }
      
      return correctedUrl;
    } catch (error) {
      console.error('❌ [URL-VALIDATION] URL inválida:', url, error);
      return url;
    }
  }
}
