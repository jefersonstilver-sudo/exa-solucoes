import { AdminEmailTemplates } from './email-templates.ts';
import { createAdminWelcomeHTML } from './email-templates-html.ts';

interface AdminWelcomeEmailData {
  email: string;
  role: string;
  password: string;
  nome: string;
  createdBy?: string;
}

export const sendAdminWelcomeEmail = async (
  data: AdminWelcomeEmailData
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log(`📧 [EMAIL] Enviando email de boas-vindas profissional para ${data.email}`);
    console.log(`📋 [EMAIL DEBUG] Dados recebidos:`, JSON.stringify(data, null, 2));
    
    // Verificar se tem API key
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      const errorMsg = '❌ RESEND_API_KEY não configurada! Configure em: https://resend.com/api-keys';
      console.error(`❌ [EMAIL] ${errorMsg}`);
      return { success: false, error: errorMsg };
    }
    
    const { Resend } = await import('npm:resend@4.0.0');
    const resend = new Resend(resendApiKey);
    
    const siteUrl = Deno.env.get('SITE_URL') || 'https://www.examidia.com.br';
    
    const htmlContent = createAdminWelcomeHTML({
      nome: data.nome,
      email: data.email,
      role: data.role,
      password: data.password,
      createdBy: data.createdBy || 'Sistema',
      loginUrl: `${siteUrl}/login`
    });
    
    console.log('📤 [EMAIL] Enviando via Resend para:', data.email);
    
    const { data: emailData, error } = await resend.emails.send({
      // TODO: Após verificar domínio examidia.com.br no Resend, mudar para:
      // from: 'EXA Mídia Notificações <notificacoes@examidia.com.br>',
      from: 'EXA Mídia <onboarding@resend.dev>',
      to: [data.email],
      subject: 'Bem-vindo à Equipe EXA Mídia - Acesso Administrativo',
      html: htmlContent
    });

    if (error) {
      let errorMsg = `Erro Resend: ${error.message || String(error)}`;
      
      // Detectar erro de domínio não verificado
      if (errorMsg.includes('not verified') || errorMsg.includes('domain') || errorMsg.includes('examidia.com.br')) {
        errorMsg = `❌ DOMÍNIO NÃO VERIFICADO: O domínio examidia.com.br não está verificado no Resend. 
        
🔧 Para resolver:
1. Acesse: https://resend.com/domains
2. Adicione o domínio examidia.com.br
3. Configure os registros DNS (SPF, DKIM, DMARC)
4. Aguarde verificação (pode levar até 48h)

⚠️ Enquanto isso, emails só podem ser enviados para: jefersonstilver@gmail.com
        
Erro original: ${error.message || String(error)}`;
      }
      
      console.error(`❌ [EMAIL] ${errorMsg}`);
      return { success: false, error: errorMsg };
    }

    console.log('✅ [EMAIL] Email profissional enviado com sucesso:', emailData);
    return { success: true };
    
  } catch (error: any) {
    const errorMsg = `Erro crítico: ${error?.message || String(error)}`;
    console.error(`💥 [EMAIL] ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
};
