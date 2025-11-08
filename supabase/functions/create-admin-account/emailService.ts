import { AdminEmailTemplates } from './email-templates.ts';

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
    
    const htmlContent = AdminEmailTemplates.createAdminWelcomeHTML({
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
      const errorMsg = `Erro Resend: ${error.message || String(error)}`;
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
