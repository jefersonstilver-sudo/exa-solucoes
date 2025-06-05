
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

export class LinkGenerator {
  private supabaseUrl: string;
  private serviceRoleKey: string;
  private supabaseAdmin: any;

  constructor(supabaseUrl: string, serviceRoleKey: string) {
    this.supabaseUrl = supabaseUrl;
    this.serviceRoleKey = serviceRoleKey;
    this.supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  async generateConfirmationLink(email: string): Promise<string> {
    console.log('🔗 [LINK-GENERATOR] Gerando link de confirmação válido para:', email);
    
    try {
      // Usar a API oficial do Supabase para gerar link de confirmação
      const { data, error } = await this.supabaseAdmin.auth.admin.generateLink({
        type: 'signup',
        email: email,
        options: {
          redirectTo: 'https://indexamidia.com/confirmacao'
        }
      });

      if (error) {
        console.error('❌ [LINK-GENERATOR] Erro na API do Supabase:', error);
        throw error;
      }

      if (!data.properties?.action_link) {
        throw new Error('Link de confirmação não foi gerado pela API do Supabase');
      }

      const confirmationUrl = data.properties.action_link;
      console.log('✅ [LINK-GENERATOR] Link válido gerado:', confirmationUrl);
      
      return confirmationUrl;
    } catch (error) {
      console.error('❌ [LINK-GENERATOR] Erro ao gerar link:', error);
      
      // Fallback: tentar gerar um link manual (última opção)
      console.log('⚠️ [LINK-GENERATOR] Usando fallback manual');
      const baseUrl = this.supabaseUrl;
      const redirectUrl = encodeURIComponent('https://indexamidia.com/confirmacao');
      const fallbackUrl = `${baseUrl}/auth/v1/verify?type=signup&redirect_to=${redirectUrl}`;
      
      return fallbackUrl;
    }
  }
}
