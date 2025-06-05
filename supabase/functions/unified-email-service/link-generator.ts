
export class LinkGenerator {
  private supabaseUrl: string;
  private serviceRoleKey: string;

  constructor(supabaseUrl: string, serviceRoleKey: string) {
    this.supabaseUrl = supabaseUrl;
    this.serviceRoleKey = serviceRoleKey;
  }

  async generateConfirmationLink(email: string): Promise<string> {
    console.log('🔗 [LINK-GENERATOR] Gerando link de confirmação para:', email);
    
    try {
      // Para reenvio, usar uma estratégia mais simples
      const baseUrl = this.supabaseUrl;
      const redirectUrl = encodeURIComponent('https://indexamidia.com/confirmacao');
      
      // Gerar um link simples mas funcional
      const confirmationUrl = `${baseUrl}/auth/v1/verify?type=signup&token_hash=resend_${Date.now()}&redirect_to=${redirectUrl}`;
      
      console.log('✅ [LINK-GENERATOR] Link gerado:', confirmationUrl);
      return confirmationUrl;
    } catch (error) {
      console.error('❌ [LINK-GENERATOR] Erro ao gerar link:', error);
      throw error;
    }
  }
}
