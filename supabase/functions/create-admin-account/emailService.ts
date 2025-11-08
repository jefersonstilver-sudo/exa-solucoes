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
    
    const Resend = (await import('npm:resend@4.0.0')).Resend;
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    
    const siteUrl = Deno.env.get('SITE_URL') || 'https://www.examidia.com.br';
    
    const htmlContent = AdminEmailTemplates.createAdminWelcomeHTML({
      nome: data.nome,
      email: data.email,
      role: data.role,
      password: data.password,
      createdBy: data.createdBy || 'Sistema',
      loginUrl: `${siteUrl}/login`
    });
    
    const { data: emailData, error } = await resend.emails.send({
      // TODO: Após verificar domínio examidia.com.br no Resend, mudar para:
      // from: 'EXA Mídia Notificações <notificacoes@examidia.com.br>',
      from: 'EXA Mídia <onboarding@resend.dev>',
      to: [data.email],
      subject: 'Bem-vindo à Equipe EXA Mídia - Acesso Administrativo',
      html: htmlContent
    });

    if (error) {
      console.error('❌ [EMAIL] Erro ao enviar email:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ [EMAIL] Email profissional enviado com sucesso:', emailData);
    return { success: true };
    
  } catch (error: any) {
    console.error('💥 [EMAIL] Erro crítico ao enviar email:', error);
    return { success: false, error: error.message };
  }
};
