
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

  async generateConfirmationLink(email: string, originalToken?: string): Promise<string> {
    console.log('🔗 [LINK-GENERATOR] Gerando link de confirmação válido para:', email);
    
    try {
      // Se temos um token original válido, tentar usá-lo primeiro
      if (originalToken) {
        console.log('🔄 [LINK-GENERATOR] Tentando usar token original fornecido');
        const siteUrl = Deno.env.get('SITE_URL') || 'https://loving-bough-1xb6c3h.lovableproject.com';
        const directLink = `${siteUrl}/confirmacao#access_token=${originalToken}&type=signup`;
        
        // Verificar se o token ainda é válido (teste simples)
        try {
          const { data: testData, error: testError } = await this.supabaseAdmin.auth.getUser(originalToken);
          if (!testError && testData.user) {
            console.log('✅ [LINK-GENERATOR] Token original ainda válido, usando link direto');
            return directLink;
          }
        } catch (e) {
          console.log('⚠️ [LINK-GENERATOR] Token original não é mais válido, gerando novo');
        }
      }
      
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
      
      // Estratégia de geração de link baseada no status do usuário
      let linkType: string;
      let shouldTryAlternatives = true;
      
      if (!userExists) {
        // Usuário novo - usar signup
        linkType = 'signup';
        shouldTryAlternatives = false;
      } else if (!emailConfirmed) {
        // Usuário existe mas email não confirmado - usar signup
        linkType = 'signup';
        shouldTryAlternatives = false;
      } else {
        // Usuário existe e email já confirmado - usar recovery para permitir login direto
        linkType = 'recovery';
        shouldTryAlternatives = true;
      }
      
      console.log(`🔧 [LINK-GENERATOR] Usando estratégia: ${linkType}`);
      
      // Tentar gerar link com o tipo principal
        // Detectar URL base dinamicamente
        const siteUrl = Deno.env.get('SITE_URL') || 'https://indexamidia.com.br';
        const redirectUrl = `${siteUrl}/confirmacao`;
        
        console.log(`🌐 [LINK-GENERATOR] URL de redirecionamento: ${redirectUrl}`);
        
        // CONFIGURAÇÕES OTIMIZADAS para links de longa duração
        const { data, error } = await this.supabaseAdmin.auth.admin.generateLink({
          type: linkType,
          email: email,
          options: {
            redirectTo: redirectUrl,
            // Tentar configurar uma expiração mais longa se possível
            data: {
              extend_expiration: true,
              confirmation_url: redirectUrl
            }
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
