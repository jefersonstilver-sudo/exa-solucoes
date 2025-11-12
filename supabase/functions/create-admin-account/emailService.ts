import * as EmailTemplates from '../_shared/email-templates/index.ts';
import { EmailLogger } from '../_shared/email-logger.ts';

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
  const emailLogger = new EmailLogger();
  
  try {
    console.log(`📧 [EMAIL] Enviando email de boas-vindas profissional para ${data.email}`);
    console.log(`📋 [EMAIL DEBUG] Nome: "${data.nome}"`);
    
    // Verificar se tem API key
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      const errorMsg = '❌ RESEND_API_KEY não configurada! Configure em: https://resend.com/api-keys';
      console.error(`❌ [EMAIL] ${errorMsg}`);
      
      await emailLogger.logFailure(
        'admin_welcome',
        data.email,
        'Bem-vindo à Equipe EXA Mídia - Acesso Administrativo',
        errorMsg,
        data.nome,
        { role: data.role, createdBy: data.createdBy }
      );
      
      return { success: false, error: errorMsg };
    }
    
    const { Resend } = await import('npm:resend@4.0.0');
    const resend = new Resend(resendApiKey);
    
    const siteUrl = Deno.env.get('SITE_URL') || 'https://www.examidia.com.br';
    
    const htmlContent = EmailTemplates.createAdminWelcomeEmail({
      userEmail: data.email,
      userName: data.nome,
      nome: data.nome,
      email: data.email,
      role: data.role as 'super_admin' | 'admin' | 'admin_marketing' | 'admin_financeiro',
      password: data.password,
      createdBy: data.createdBy || 'Sistema',
      loginUrl: `${siteUrl}/login`
    });
    
    console.log('📤 [EMAIL] Enviando via Resend para:', data.email);
    
    const { data: emailData, error } = await resend.emails.send({
      from: 'EXA Mídia <noreply@examidia.com.br>',
      to: [data.email],
      subject: 'Bem-vindo à Equipe EXA Mídia - Acesso Administrativo',
      html: htmlContent
    });

    if (error) {
      const errorMsg = `Erro Resend: ${error.message || String(error)}`;
      console.error(`❌ [EMAIL] ${errorMsg}`);
      
      await emailLogger.logFailure(
        'admin_welcome',
        data.email,
        'Bem-vindo à Equipe EXA Mídia - Acesso Administrativo',
        errorMsg,
        data.nome,
        { role: data.role, createdBy: data.createdBy }
      );
      
      return { success: false, error: errorMsg };
    }

    console.log('✅ [EMAIL] Email profissional enviado com sucesso:', emailData);
    
    // Registrar no log
    await emailLogger.logSuccess(
      'admin_welcome',
      data.email,
      'Bem-vindo à Equipe EXA Mídia - Acesso Administrativo',
      emailData?.id || 'unknown',
      data.nome,
      { role: data.role, createdBy: data.createdBy }
    );
    
    return { success: true };
    
  } catch (error: any) {
    const errorMsg = `Erro crítico: ${error?.message || String(error)}`;
    console.error(`💥 [EMAIL] ${errorMsg}`);
    
    await emailLogger.logFailure(
      'admin_welcome',
      data.email,
      'Bem-vindo à Equipe EXA Mídia - Acesso Administrativo',
      errorMsg,
      data.nome,
      { role: data.role, createdBy: data.createdBy }
    );
    
    return { success: false, error: errorMsg };
  }
};
