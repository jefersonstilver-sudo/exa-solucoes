
import { Resend } from 'npm:resend@4.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

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
  ipAddress?: string;
  userAgent?: string;
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
    console.log(`📧 [SUPER-ADMIN-NOTIFICATION] Enviando para ${data.superAdminEmail}`);
    
    const roleName = getRoleName(data.newUser.role);
    const badge = getRoleBadge(data.newUser.role);
    const responsibilities = getResponsibilities(data.newUser.role);
    const siteUrl = Deno.env.get('SITE_URL') || 'https://www.examidia.com.br';
    
    const { error } = await resend.emails.send({
      from: 'EXA Mídia <onboarding@resend.dev>',
      to: [data.superAdminEmail],
      subject: `🔔 Nova Conta Administrativa Criada - ${roleName}`,
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #1f2937;
              background-color: #f9fafb;
            }
            .email-container { 
              max-width: 650px;
              margin: 0 auto;
              background: white;
            }
            .header {
              background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              font-size: 24px;
              font-weight: 700;
              margin-bottom: 8px;
            }
            .header p {
              font-size: 14px;
              opacity: 0.9;
            }
            .content {
              padding: 35px 30px;
            }
            .greeting {
              font-size: 18px;
              color: #111827;
              margin-bottom: 20px;
            }
            .info-card {
              background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
              border: 2px solid #e5e7eb;
              border-radius: 12px;
              padding: 25px;
              margin: 25px 0;
            }
            .info-card-title {
              font-size: 16px;
              font-weight: 700;
              color: #374151;
              margin-bottom: 20px;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              padding: 12px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .info-label {
              font-weight: 600;
              color: #6b7280;
              font-size: 13px;
            }
            .info-value {
              color: #111827;
              font-size: 14px;
              font-weight: 500;
              text-align: right;
              max-width: 60%;
            }
            .role-badge {
              display: inline-block;
              background: ${badge.bg};
              color: ${badge.color};
              padding: 6px 16px;
              border-radius: 20px;
              font-size: 14px;
              font-weight: 600;
              border: 2px solid ${badge.color};
            }
            .section {
              margin: 25px 0;
            }
            .section-title {
              font-size: 16px;
              color: #111827;
              font-weight: 600;
              margin-bottom: 12px;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .responsibilities-list {
              background: white;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 15px 20px;
            }
            .responsibility-item {
              padding: 8px 0;
              color: #4b5563;
              font-size: 14px;
              border-bottom: 1px solid #f3f4f6;
            }
            .responsibility-item:last-child {
              border-bottom: none;
            }
            .responsibility-item::before {
              content: "•";
              color: #1e40af;
              font-weight: bold;
              display: inline-block;
              width: 1em;
              margin-right: 8px;
            }
            .status-box {
              padding: 15px 20px;
              border-radius: 8px;
              margin: 20px 0;
              display: flex;
              align-items: center;
              gap: 12px;
            }
            .status-success {
              background: #d1fae5;
              border-left: 4px solid #10b981;
              color: #065f46;
            }
            .status-error {
              background: #fee2e2;
              border-left: 4px solid #ef4444;
              color: #991b1b;
            }
            .action-buttons {
              display: flex;
              flex-direction: column;
              gap: 10px;
              margin: 25px 0;
            }
            .action-button {
              display: block;
              background: white;
              border: 2px solid #e5e7eb;
              padding: 14px 20px;
              text-decoration: none;
              color: #374151;
              border-radius: 8px;
              font-weight: 500;
              font-size: 14px;
              text-align: left;
              transition: all 0.3s;
            }
            .action-button:hover {
              border-color: #1e40af;
              background: #eff6ff;
            }
            .action-button-icon {
              float: right;
              color: #1e40af;
            }
            .alert-box {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 18px 20px;
              border-radius: 8px;
              margin: 25px 0;
            }
            .alert-box strong {
              display: block;
              color: #92400e;
              font-size: 14px;
              margin-bottom: 6px;
            }
            .alert-list {
              margin-top: 10px;
            }
            .alert-item {
              color: #78350f;
              font-size: 13px;
              padding: 4px 0;
            }
            .alert-item::before {
              content: "→";
              margin-right: 8px;
              font-weight: bold;
            }
            .metadata-box {
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 15px;
              margin: 20px 0;
              font-size: 12px;
              color: #6b7280;
            }
            .metadata-row {
              padding: 4px 0;
            }
            .footer {
              text-align: center;
              color: #6b7280;
              padding: 25px;
              font-size: 13px;
              background: #f9fafb;
              border-top: 1px solid #e5e7eb;
            }
            .divider {
              height: 1px;
              background: linear-gradient(to right, transparent, #e5e7eb, transparent);
              margin: 25px 0;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <h1>🔔 Nova Conta Administrativa Criada</h1>
              <p>Notificação do Sistema de Gerenciamento</p>
            </div>

            <div class="content">
              <div class="greeting">
                Olá, ${data.superAdminName}!
              </div>

              <p style="color: #4b5563; font-size: 15px; margin-bottom: 25px;">
                Uma nova conta administrativa foi criada no sistema EXA Mídia. 
                Segue abaixo os detalhes completos da conta criada.
              </p>

              <div class="info-card">
                <div class="info-card-title">
                  👤 Informações da Conta Criada
                </div>
                
                <div class="info-row">
                  <span class="info-label">Nome Completo</span>
                  <span class="info-value">${data.newUser.nome}</span>
                </div>
                
                <div class="info-row">
                  <span class="info-label">Email</span>
                  <span class="info-value">${data.newUser.email}</span>
                </div>
                
                <div class="info-row">
                  <span class="info-label">Tipo de Conta</span>
                  <span class="info-value">
                    <span class="role-badge">${badge.icon} ${roleName}</span>
                  </span>
                </div>
                
                ${data.newUser.cpf ? `
                  <div class="info-row">
                    <span class="info-label">CPF</span>
                    <span class="info-value">${data.newUser.cpf}</span>
                  </div>
                ` : ''}
                
                ${data.newUser.tipo_documento ? `
                  <div class="info-row">
                    <span class="info-label">Tipo de Documento</span>
                    <span class="info-value">${data.newUser.tipo_documento}</span>
                  </div>
                ` : ''}
                
                <div class="info-row">
                  <span class="info-label">Criado Por</span>
                  <span class="info-value">${data.createdBy}</span>
                </div>
                
                <div class="info-row">
                  <span class="info-label">Data e Hora</span>
                  <span class="info-value">${new Date(data.timestamp).toLocaleString('pt-BR', {
                    dateStyle: 'short',
                    timeStyle: 'short'
                  })}</span>
                </div>
              </div>

              <div class="section">
                <div class="section-title">📋 Responsabilidades Atribuídas</div>
                <div class="responsibilities-list">
                  ${responsibilities.map(resp => `
                    <div class="responsibility-item">${resp}</div>
                  `).join('')}
                </div>
              </div>

              <div class="${data.emailSentStatus ? 'status-success' : 'status-error'} status-box">
                <span style="font-size: 24px;">
                  ${data.emailSentStatus ? '✅' : '❌'}
                </span>
                <div>
                  <strong style="display: block; margin-bottom: 4px;">
                    ${data.emailSentStatus ? 'Email Enviado com Sucesso' : 'Falha ao Enviar Email'}
                  </strong>
                  <span style="font-size: 13px;">
                    ${data.emailSentStatus 
                      ? 'O usuário recebeu as credenciais de acesso por email'
                      : 'O email de boas-vindas não pôde ser enviado. Entre em contato com o usuário manualmente.'
                    }
                  </span>
                </div>
              </div>

              <div class="divider"></div>

              <div class="section-title">🔗 Ações Rápidas</div>
              <div class="action-buttons">
                <a href="${siteUrl}/super_admin/usuarios" class="action-button">
                  Ver Lista de Todos os Usuários
                  <span class="action-button-icon">→</span>
                </a>
                <a href="${siteUrl}/super_admin/auditoria" class="action-button">
                  Acessar Auditoria do Sistema
                  <span class="action-button-icon">→</span>
                </a>
                <a href="${siteUrl}/super_admin/logs" class="action-button">
                  Verificar Logs Recentes
                  <span class="action-button-icon">→</span>
                </a>
              </div>

              <div class="alert-box">
                <strong>⚠️ PRÓXIMAS AÇÕES RECOMENDADAS</strong>
                <div class="alert-list">
                  <div class="alert-item">Confirmar que o novo usuário recebeu o email</div>
                  <div class="alert-item">Verificar se o usuário alterou a senha no primeiro acesso</div>
                  <div class="alert-item">Monitorar as primeiras atividades no sistema</div>
                  <div class="alert-item">Revisar logs de auditoria nas próximas 48h</div>
                </div>
              </div>

              ${data.ipAddress || data.userAgent ? `
                <div class="metadata-box">
                  <strong style="font-size: 13px; color: #374151; display: block; margin-bottom: 8px;">
                    📊 Metadados da Criação
                  </strong>
                  ${data.ipAddress ? `
                    <div class="metadata-row">
                      <strong>IP de Origem:</strong> ${data.ipAddress}
                    </div>
                  ` : ''}
                  ${data.userAgent ? `
                    <div class="metadata-row">
                      <strong>User Agent:</strong> ${data.userAgent}
                    </div>
                  ` : ''}
                  <div class="metadata-row">
                    <strong>Timestamp:</strong> ${data.timestamp}
                  </div>
                </div>
              ` : ''}

              <div class="divider"></div>

              <p style="font-size: 13px; color: #6b7280; line-height: 1.7;">
                Esta é uma notificação automática do sistema de gerenciamento. 
                Todas as criações de contas administrativas são registradas e auditadas automaticamente.
              </p>
            </div>

            <div class="footer">
              <p>Sistema de Notificações Automáticas - EXA Mídia</p>
              <p style="margin-top: 8px;">
                <strong style="color: #1e40af;">© ${new Date().getFullYear()} EXA Mídia</strong>
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('❌ [SUPER-ADMIN-NOTIFICATION] Erro ao enviar:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ [SUPER-ADMIN-NOTIFICATION] Enviado com sucesso');
    return { success: true };

  } catch (error: any) {
    console.error('💥 [SUPER-ADMIN-NOTIFICATION] Erro crítico:', error);
    return { success: false, error: error.message };
  }
};
