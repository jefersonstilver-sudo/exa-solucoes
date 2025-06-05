
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
      // Primeiro, verificar se o usuário já existe
      const { data: users, error: userError } = await this.supabaseAdmin.auth.admin.listUsers();
      
      if (userError) {
        console.error('❌ [LINK-GENERATOR] Erro ao verificar usuários:', userError);
      }
      
      const userExists = users?.users?.some(user => user.email === email);
      console.log(`🔍 [LINK-GENERATOR] Usuário ${email} existe:`, userExists);
      
      // Usar tipo apropriado baseado na existência do usuário
      const linkType = userExists ? 'email_change' : 'signup';
      console.log(`🔧 [LINK-GENERATOR] Usando tipo de link: ${linkType}`);
      
      const { data, error } = await this.supabaseAdmin.auth.admin.generateLink({
        type: linkType,
        email: email,
        options: {
          redirectTo: 'https://indexamidia.com/confirmacao'
        }
      });

      if (error) {
        console.error(`❌ [LINK-GENERATOR] Erro na API do Supabase (${linkType}):`, error);
        
        // Se falhou com email_change, tentar com signup
        if (linkType === 'email_change') {
          console.log('🔄 [LINK-GENERATOR] Tentando com tipo signup...');
          
          const { data: signupData, error: signupError } = await this.supabaseAdmin.auth.admin.generateLink({
            type: 'signup',
            email: email,
            options: {
              redirectTo: 'https://indexamidia.com/confirmacao'
            }
          });
          
          if (!signupError && signupData.properties?.action_link) {
            console.log('✅ [LINK-GENERATOR] Link signup gerado com sucesso');
            return signupData.properties.action_link;
          }
        }
        
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
      
      // Fallback melhorado: gerar link com token válido
      console.log('⚠️ [LINK-GENERATOR] Usando fallback com token válido');
      
      try {
        // Tentar gerar um token de recuperação que funciona para usuários existentes
        const { data: resetData, error: resetError } = await this.supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email: email,
          options: {
            redirectTo: 'https://indexamidia.com/confirmacao'
          }
        });
        
        if (!resetError && resetData.properties?.action_link) {
          console.log('✅ [LINK-GENERATOR] Fallback recovery link gerado');
          return resetData.properties.action_link;
        }
      } catch (fallbackError) {
        console.error('❌ [LINK-GENERATOR] Fallback também falhou:', fallbackError);
      }
      
      // Último recurso: link manual (sem tokens - pode falhar)
      console.log('⚠️ [LINK-GENERATOR] Usando último recurso manual');
      const baseUrl = this.supabaseUrl;
      const redirectUrl = encodeURIComponent('https://indexamidia.com/confirmacao');
      const fallbackUrl = `${baseUrl}/auth/v1/verify?type=signup&redirect_to=${redirectUrl}`;
      
      return fallbackUrl;
    }
  }
}
