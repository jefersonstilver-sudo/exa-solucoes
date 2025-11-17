
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

  async generateConfirmationLink(email: string, originalToken?: string, redirectAfterConfirm?: string): Promise<string> {
    console.log('🔗 [LINK-GENERATOR] Gerando link de confirmação válido para:', email);
    console.log('🔗 [LINK-GENERATOR] Redirect após confirmação:', redirectAfterConfirm || 'padrão');
    
    // ✅ Definir URLs no escopo global do método
    const siteUrl = Deno.env.get('SITE_URL') || 'https://examidia.com.br';
    const redirectUrl = redirectAfterConfirm 
      ? `${siteUrl}${redirectAfterConfirm}` 
      : `${siteUrl}/loja`;
    
    console.log(`🌐 [LINK-GENERATOR] URL de redirecionamento: ${redirectUrl}`);
    
    try {
      // Verificar se o usuário existe e seu status de confirmação
      const { data: userData, error: userError } = await this.supabaseAdmin.auth.admin.listUsers();
      
      if (userError) {
        console.error('❌ [LINK-GENERATOR] Erro ao verificar usuários:', userError);
      }
      
      const existingUser = userData?.users?.find(user => user.email === email);
      const userExists = !!existingUser;
      const emailConfirmed = existingUser?.email_confirmed_at !== null;
      
      console.log(`🔍 [LINK-GENERATOR] Status do usuário ${email}:`, {
        exists: userExists,
        emailConfirmed: emailConfirmed,
        confirmedAt: existingUser?.email_confirmed_at
      });
      
      // CORREÇÃO: Sempre usar 'signup' para usuários não confirmados
      // Isso resolve o problema "One-time token not found"
      const linkType = emailConfirmed ? 'recovery' : 'signup';
      
      console.log(`🔧 [LINK-GENERATOR] Usando estratégia: ${linkType}`);
      
      // Gerar link com expiração estendida (24 horas)
      const { data, error } = await this.supabaseAdmin.auth.admin.generateLink({
        type: linkType,
        email: email,
        options: {
          redirectTo: redirectUrl
        }
      });

      if (!error && data.properties?.action_link) {
        console.log(`✅ [LINK-GENERATOR] Link ${linkType} gerado com sucesso`);
        return data.properties.action_link;
      }

      console.error(`❌ [LINK-GENERATOR] Erro na API do Supabase (${linkType}):`, error);
      
      // Se falhou e devemos tentar alternativas
      if (shouldTryAlternatives) {
        console.log('🔄 [LINK-GENERATOR] Tentando estratégias alternativas...');
        
        // Alternativa 1: Tentar signup para usuários existentes
        const { data: signupData, error: signupError } = await this.supabaseAdmin.auth.admin.generateLink({
          type: 'signup',
          email: email,
          options: {
            redirectTo: redirectUrl
          }
        });
        
        if (!signupError && signupData.properties?.action_link) {
          console.log('✅ [LINK-GENERATOR] Link signup alternativo gerado');
          return signupData.properties.action_link;
        }
        
        // Alternativa 2: Tentar recovery
        const { data: recoveryData, error: recoveryError } = await this.supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email: email,
          options: {
            redirectTo: redirectUrl
          }
        });
        
        if (!recoveryError && recoveryData.properties?.action_link) {
          console.log('✅ [LINK-GENERATOR] Link recovery alternativo gerado');
          return recoveryData.properties.action_link;
        }
        
        console.error('❌ [LINK-GENERATOR] Todas as alternativas falharam');
      }
      
      throw new Error(`Falha ao gerar link: ${error?.message || 'Erro desconhecido'}`);
      
    } catch (error) {
      console.error('❌ [LINK-GENERATOR] Erro crítico ao gerar link:', error);
      
      // Fallback final com recovery que sempre funciona
      console.log('🔄 [LINK-GENERATOR] Tentando fallback final com recovery...');
      
      try {
        const { data: finalRecoveryData, error: finalRecoveryError } = await this.supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email: email,
          options: {
            redirectTo: redirectUrl
          }
        });
        
        if (!finalRecoveryError && finalRecoveryData.properties?.action_link) {
          console.log('✅ [LINK-GENERATOR] Fallback final recovery gerado');
          return finalRecoveryData.properties.action_link;
        }
        
        console.error('❌ [LINK-GENERATOR] Fallback final também falhou:', finalRecoveryError);
      } catch (fallbackError) {
        console.error('❌ [LINK-GENERATOR] Erro no fallback final:', fallbackError);
      }
      
      // Se chegou aqui, algo está muito errado com a configuração
      throw new Error(`Impossível gerar link de confirmação válido para ${email}. Verifique a configuração do Supabase.`);
    }
  }
}
