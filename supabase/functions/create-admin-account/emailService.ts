
import { Resend } from 'npm:resend@4.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const getRoleName = (role: string): string => {
  const roleNames: Record<string, string> = {
    'super_admin': 'Super Administrador',
    'admin': 'Administrador Geral',
    'admin_marketing': 'Administrador de Marketing',
    'admin_financeiro': 'Administrador Financeiro'
  };
  return roleNames[role] || role;
};

export const sendAdminWelcomeEmail = async (
  email: string,
  role: string,
  password: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log(`📧 [EMAIL] Enviando email de boas-vindas para ${email}`);
    
    const roleName = getRoleName(role);
    
    const { data, error } = await resend.emails.send({
      from: 'EXA Mídia <onboarding@resend.dev>',
      to: [email],
      subject: 'Bem-vindo à Equipe EXA Mídia - Acesso Administrativo',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #9C1E1E 0%, #7D1818 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .credentials { background: white; padding: 20px; border-left: 4px solid #9C1E1E; margin: 20px 0; }
            .credential-item { margin: 10px 0; }
            .credential-label { font-weight: bold; color: #9C1E1E; }
            .button { display: inline-block; background: #9C1E1E; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; color: #666; padding: 20px; font-size: 12px; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Bem-vindo à EXA Mídia!</h1>
            </div>
            <div class="content">
              <h2>Olá!</h2>
              <p>Você acaba de receber acesso administrativo ao sistema da <strong>EXA Mídia</strong>.</p>
              
              <p>Seu perfil foi configurado como: <strong>${roleName}</strong></p>
              
              <div class="credentials">
                <h3>🔐 Suas Credenciais de Acesso</h3>
                <div class="credential-item">
                  <span class="credential-label">Email:</span> ${email}
                </div>
                <div class="credential-item">
                  <span class="credential-label">Senha Temporária:</span> ${password}
                </div>
              </div>
              
              <div class="warning">
                <strong>⚠️ IMPORTANTE:</strong> Por motivos de segurança, você deve alterar sua senha no primeiro acesso.
              </div>
              
              <p style="text-align: center;">
                <a href="${Deno.env.get('SITE_URL') || 'https://www.examidia.com.br'}/login" class="button">
                  Fazer Login Agora
                </a>
              </p>
              
              <p>Caso tenha alguma dúvida, entre em contato com a equipe de TI.</p>
              
              <p>Atenciosamente,<br><strong>Equipe EXA Mídia</strong></p>
            </div>
            <div class="footer">
              <p>Este é um email automático. Por favor, não responda.</p>
              <p>&copy; ${new Date().getFullYear()} EXA Mídia. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('❌ [EMAIL] Erro ao enviar email:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ [EMAIL] Email enviado com sucesso:', data);
    return { success: true };
    
  } catch (error: any) {
    console.error('💥 [EMAIL] Erro crítico ao enviar email:', error);
    return { success: false, error: error.message };
  }
};
