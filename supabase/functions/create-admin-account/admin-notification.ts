
import { Resend } from 'npm:resend@4.0.0';
import { EmailLogger } from '../_shared/email-logger.ts';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
const emailLogger = new EmailLogger();

interface NewUserData {
  nome: string;
  email: string;
  role: string;
  cpf?: string;
  tipo_documento?: string;
}

interface NotificationData {
  superAdminEmail: string;
  superAdminName: string;
  newUser: NewUserData;
  createdBy: string;
  emailSentStatus: boolean;
  timestamp: string;
}

const getRoleName = (role: string): string => {
  const roleNames: Record<string, string> = {
    'super_admin': 'Super Administrador',
    'admin': 'Administrador Geral',
    'admin_marketing': 'Administrador de Marketing',
    'admin_financeiro': 'Administrador Financeiro'
  };
  return roleNames[role] || role;
};

const getRoleBadge = (role: string): { icon: string; color: string; bg: string } => {
  const badges: Record<string, { icon: string; color: string; bg: string }> = {
    'super_admin': { icon: '👑', color: '#7C3AED', bg: '#EDE9FE' },
    'admin': { icon: '🛡️', color: '#0EA5E9', bg: '#E0F2FE' },
    'admin_marketing': { icon: '🎨', color: '#EC4899', bg: '#FCE7F3' },
    'admin_financeiro': { icon: '💰', color: '#10B981', bg: '#D1FAE5' }
  };
  return badges[role] || badges['admin'];
};

const getResponsibilities = (role: string): string[] => {
  const responsibilities: Record<string, string[]> = {
    'super_admin': [
      'Gestão total do sistema',
      'Criação de contas administrativas',
      'Auditoria completa',
      'Configurações avançadas'
    ],
    'admin': [
      'Gestão de prédios e painéis',
      'Aprovação de vídeos',
      'Gerenciamento de pedidos',
      'Suporte a clientes'
    ],
    'admin_marketing': [
      'Gestão de leads',
      'Configuração da homepage',
      'Aprovação de conteúdo visual',
      'Campanhas de marketing'
    ],
    'admin_financeiro': [
      'Análise de pedidos e vendas',
      'Benefícios de prestadores',
      'Relatórios financeiros',
      'Exportação de dados contábeis'
    ]
  };
  return responsibilities[role] || [];
};

export const sendSuperAdminNotification = async (
  data: NotificationData
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log(`📧 [NOTIFICATION] Enviando para ${data.superAdminEmail}`);
    console.log(`📋 [NOTIFICATION] Nome recebido: "${data.newUser.nome}"`);
    console.log(`📋 [NOTIFICATION] Email: "${data.newUser.email}"`);
    console.log(`📋 [NOTIFICATION] Role: "${data.newUser.role}"`);
    
    const roleName = getRoleName(data.newUser.role);
    const badge = getRoleBadge(data.newUser.role);
    const responsibilities = getResponsibilities(data.newUser.role);
    const siteUrl = Deno.env.get('SITE_URL') || 'https://www.examidia.com.br';
    
    const { error } = await resend.emails.send({
      from: 'EXA Mídia <noreply@examidia.com.br>',
      to: [data.superAdminEmail],
      subject: `🔔 Nova Conta Administrativa Criada - ${roleName}`,
      html: `
        <!DOCTYPE html>
...
        </body>
        </html>
      `
    });

    if (error) {
      console.error('❌ [SUPER-ADMIN-NOTIFICATION] Erro ao enviar:', error);
      
      await emailLogger.logFailure(
        'admin_notification',
        data.superAdminEmail,
        `🔔 Nova Conta Administrativa Criada - ${roleName}`,
        error.message,
        data.superAdminName,
        { 
          newUserEmail: data.newUser.email, 
          newUserRole: data.newUser.role,
          createdBy: data.createdBy 
        }
      );
      
      return { success: false, error: error.message };
    }

    console.log('✅ [SUPER-ADMIN-NOTIFICATION] Enviado com sucesso');
    
    // Registrar log de sucesso
    await emailLogger.logSuccess(
      'admin_notification',
      data.superAdminEmail,
      `🔔 Nova Conta Administrativa Criada - ${roleName}`,
      'notification-' + Date.now(),
      data.superAdminName,
      { 
        newUserEmail: data.newUser.email, 
        newUserRole: data.newUser.role,
        createdBy: data.createdBy 
      }
    );
    
    return { success: true };

  } catch (error: any) {
    console.error('💥 [SUPER-ADMIN-NOTIFICATION] Erro crítico:', error);
    
    await emailLogger.logFailure(
      'admin_notification',
      data.superAdminEmail,
      `🔔 Nova Conta Administrativa Criada`,
      error.message,
      data.superAdminName,
      { 
        newUserEmail: data.newUser.email, 
        newUserRole: data.newUser.role,
        createdBy: data.createdBy 
      }
    );
    
    return { success: false, error: error.message };
  }
};
