
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export class LinkGenerator {
  private supabaseAdmin;

  constructor(supabaseUrl: string, serviceRoleKey: string) {
    this.supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
  }

  async generateConfirmationLink(email: string) {
    let linkData, linkError;
    
    console.log('🔗 [LINK-GENERATOR] Tentando gerar link de confirmação...');
    
    try {
      // Tentar primeiro com type: 'confirmation' 
      const result = await this.supabaseAdmin.auth.admin.generateLink({
        type: 'confirmation',
        email: email,
      });
      
      linkData = result.data;
      linkError = result.error;
      
      console.log('✅ [LINK-GENERATOR] Link gerado com type: confirmation');
    } catch (confirmationError) {
      console.log('⚠️ [LINK-GENERATOR] Falha com confirmation, tentando signup...');
      
      // Fallback para type: 'signup'
      try {
        const result = await this.supabaseAdmin.auth.admin.generateLink({
          type: 'signup',
          email: email,
        });
        
        linkData = result.data;
        linkError = result.error;
        
        console.log('✅ [LINK-GENERATOR] Link gerado com type: signup (fallback)');
      } catch (signupError) {
        console.error('❌ [LINK-GENERATOR] Ambas estratégias falharam:', { confirmationError, signupError });
        linkError = signupError;
      }
    }

    if (linkError) {
      console.error('❌ [LINK-GENERATOR] Erro ao gerar link:', linkError);
      throw linkError;
    }

    const confirmationUrl = linkData.properties?.action_link;
    if (!confirmationUrl) {
      throw new Error('Link de confirmação não foi gerado');
    }

    return confirmationUrl;
  }
}
