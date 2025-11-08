
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
      // TODO: Após verificar domínio examidia.com.br no Resend, mudar para:
      // from: 'EXA Mídia Notificações <notificacoes@examidia.com.br>',
      from: 'EXA Mídia <onboarding@resend.dev>',
      to: [data.superAdminEmail],
      subject: `🔔 Nova Conta Administrativa Criada - ${roleName}`,
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f9fafb;">
            <tr>
              <td style="padding: 20px 10px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  
                  <!-- HEADER COM LOGO E CORES DA EXA -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #9C1E1E 0%, #DC2626 100%); padding: 40px 20px; text-align: center;">
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                          <td style="text-align: center; padding-bottom: 20px;">
                            <img src="https://www.examidia.com.br/logo-exa-branco.png" alt="EXA Mídia" width="180" style="display: block; margin: 0 auto; max-width: 180px; height: auto;" />
                          </td>
                        </tr>
                        <tr>
                          <td style="text-align: center;">
                            <h1 style="margin: 0; padding: 0; color: #ffffff; font-size: 26px; font-weight: 700; line-height: 1.3;">
                              🔔 Nova Conta Administrativa Criada
                            </h1>
                            <p style="margin: 10px 0 0 0; padding: 0; color: rgba(255,255,255,0.95); font-size: 15px;">
                              Notificação do Sistema de Gerenciamento
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- CONTEÚDO PRINCIPAL -->
                  <tr>
                    <td style="padding: 35px 25px;">
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        
                        <!-- SAUDAÇÃO -->
                        <tr>
                          <td style="padding-bottom: 20px;">
                            <p style="margin: 0; padding: 0; font-size: 19px; font-weight: 600; color: #111827;">
                              Olá, ${data.superAdminName}!
                            </p>
                          </td>
                        </tr>

                        <tr>
                          <td style="padding-bottom: 25px;">
                            <p style="margin: 0; padding: 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                              Uma nova conta administrativa foi criada no sistema EXA Mídia. 
                              Segue abaixo os detalhes completos da conta criada.
                            </p>
                          </td>
                        </tr>

                        <!-- CARD DE INFORMAÇÕES -->
                        <tr>
                          <td style="padding-bottom: 20px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); border: 2px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
                              <tr>
                                <td style="padding: 25px 20px;">
                                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                    <tr>
                                      <td style="padding-bottom: 20px;">
                                        <p style="margin: 0; padding: 0; font-size: 16px; font-weight: 700; color: #374151;">
                                          👤 Informações da Conta Criada
                                        </p>
                                      </td>
                                    </tr>

                                    <!-- Nome Completo -->
                                    <tr>
                                      <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                          <tr>
                                            <td style="width: 40%; vertical-align: top;">
                                              <p style="margin: 0; padding: 0; font-weight: 600; color: #6b7280; font-size: 13px;">
                                                Nome Completo
                                              </p>
                                            </td>
                                            <td style="width: 60%; text-align: right; vertical-align: top;">
                                              <p style="margin: 0; padding: 0; color: #111827; font-size: 14px; font-weight: 500;">
                                                ${data.newUser.nome || 'Não informado'}
                                              </p>
                                            </td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>

                                    <!-- Email -->
                                    <tr>
                                      <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                          <tr>
                                            <td style="width: 40%; vertical-align: top;">
                                              <p style="margin: 0; padding: 0; font-weight: 600; color: #6b7280; font-size: 13px;">
                                                Email
                                              </p>
                                            </td>
                                            <td style="width: 60%; text-align: right; vertical-align: top;">
                                              <p style="margin: 0; padding: 0; color: #111827; font-size: 14px; font-weight: 500; word-break: break-all;">
                                                ${data.newUser.email}
                                              </p>
                                            </td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>

                                    <!-- Tipo de Conta -->
                                    <tr>
                                      <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                          <tr>
                                            <td style="width: 40%; vertical-align: top;">
                                              <p style="margin: 0; padding: 0; font-weight: 600; color: #6b7280; font-size: 13px;">
                                                Tipo de Conta
                                              </p>
                                            </td>
                                            <td style="width: 60%; text-align: right; vertical-align: top;">
                                              <span style="display: inline-block; background: ${badge.bg}; color: ${badge.color}; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; border: 2px solid ${badge.color};">
                                                ${badge.icon} ${roleName}
                                              </span>
                                            </td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>

                                    <!-- CPF (se existir) -->
                                    ${data.newUser.cpf ? `
                                    <tr>
                                      <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                          <tr>
                                            <td style="width: 40%; vertical-align: top;">
                                              <p style="margin: 0; padding: 0; font-weight: 600; color: #6b7280; font-size: 13px;">
                                                CPF
                                              </p>
                                            </td>
                                            <td style="width: 60%; text-align: right; vertical-align: top;">
                                              <p style="margin: 0; padding: 0; color: #111827; font-size: 14px; font-weight: 500; font-family: 'Courier New', monospace;">
                                                ${data.newUser.cpf}
                                              </p>
                                            </td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>
                                    ` : ''}

                                    <!-- Criado Por -->
                                    <tr>
                                      <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                          <tr>
                                            <td style="width: 40%; vertical-align: top;">
                                              <p style="margin: 0; padding: 0; font-weight: 600; color: #6b7280; font-size: 13px;">
                                                Criado Por
                                              </p>
                                            </td>
                                            <td style="width: 60%; text-align: right; vertical-align: top;">
                                              <p style="margin: 0; padding: 0; color: #111827; font-size: 14px; font-weight: 500;">
                                                ${data.createdBy}
                                              </p>
                                            </td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>

                                    <!-- Data e Hora -->
                                    <tr>
                                      <td style="padding: 12px 0;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                          <tr>
                                            <td style="width: 40%; vertical-align: top;">
                                              <p style="margin: 0; padding: 0; font-weight: 600; color: #6b7280; font-size: 13px;">
                                                Data e Hora
                                              </p>
                                            </td>
                                            <td style="width: 60%; text-align: right; vertical-align: top;">
                                              <p style="margin: 0; padding: 0; color: #111827; font-size: 14px; font-weight: 500;">
                                                ${(() => {
                                                  try {
                                                    const date = new Date(data.timestamp);
                                                    if (isNaN(date.getTime())) return 'Agora';
                                                    return date.toLocaleString('pt-BR', {
                                                      day: '2-digit',
                                                      month: '2-digit',
                                                      year: 'numeric',
                                                      hour: '2-digit',
                                                      minute: '2-digit',
                                                      timeZone: 'America/Sao_Paulo'
                                                    });
                                                  } catch {
                                                    return 'Agora';
                                                  }
                                                })()}
                                              </p>
                                            </td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>

                        <!-- RESPONSABILIDADES -->
                        <tr>
                          <td style="padding: 25px 0;">
                            <p style="margin: 0 0 15px 0; padding: 0; font-size: 16px; font-weight: 600; color: #111827;">
                              📋 Responsabilidades Atribuídas
                            </p>
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px;">
                              <tr>
                                <td style="padding: 15px 20px;">
                                  ${responsibilities.map((resp, index) => `
                                    <p style="margin: 0; padding: 8px 0; color: #4b5563; font-size: 14px; ${index < responsibilities.length - 1 ? 'border-bottom: 1px solid #f3f4f6;' : ''}">
                                      <span style="color: #9C1E1E; font-weight: bold; margin-right: 8px;">•</span>
                                      ${resp}
                                    </p>
                                  `).join('')}
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>

                        <!-- STATUS DO EMAIL -->
                        <tr>
                          <td style="padding-bottom: 25px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: ${data.emailSentStatus ? '#d1fae5' : '#fee2e2'}; border-left: 4px solid ${data.emailSentStatus ? '#10b981' : '#ef4444'}; border-radius: 8px;">
                              <tr>
                                <td style="padding: 15px 20px;">
                                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                    <tr>
                                      <td style="width: 40px; vertical-align: top;">
                                        <p style="margin: 0; padding: 0; font-size: 24px;">
                                          ${data.emailSentStatus ? '✅' : '❌'}
                                        </p>
                                      </td>
                                      <td style="vertical-align: top;">
                                        <p style="margin: 0 0 4px 0; padding: 0; font-weight: 700; font-size: 14px; color: ${data.emailSentStatus ? '#065f46' : '#991b1b'};">
                                          ${data.emailSentStatus ? 'Email Enviado com Sucesso' : 'Falha ao Enviar Email'}
                                        </p>
                                        <p style="margin: 0; padding: 0; font-size: 13px; color: ${data.emailSentStatus ? '#065f46' : '#991b1b'};">
                                          ${data.emailSentStatus 
                                            ? 'O usuário recebeu as credenciais de acesso por email'
                                            : 'O email de boas-vindas não pôde ser enviado. Entre em contato com o usuário manualmente.'
                                          }
                                        </p>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>

                        <!-- DIVISOR -->
                        <tr>
                          <td style="padding: 20px 0;">
                            <div style="height: 1px; background: linear-gradient(to right, transparent, #e5e7eb, transparent);"></div>
                          </td>
                        </tr>

                        <!-- AÇÕES RÁPIDAS -->
                        <tr>
                          <td style="padding-bottom: 15px;">
                            <p style="margin: 0 0 15px 0; padding: 0; font-size: 16px; font-weight: 600; color: #111827;">
                              🔗 Ações Rápidas
                            </p>
                          </td>
                        </tr>

                        <tr>
                          <td style="padding-bottom: 10px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #ffffff; border: 2px solid #e5e7eb; border-radius: 8px;">
                              <tr>
                                <td style="padding: 14px 20px;">
                                  <a href="${siteUrl}/super_admin/usuarios" style="text-decoration: none; color: #374151; font-weight: 500; font-size: 14px; display: block;">
                                    Ver Lista de Todos os Usuários
                                    <span style="float: right; color: #9C1E1E;">→</span>
                                  </a>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>

                        <tr>
                          <td style="padding-bottom: 10px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #ffffff; border: 2px solid #e5e7eb; border-radius: 8px;">
                              <tr>
                                <td style="padding: 14px 20px;">
                                  <a href="${siteUrl}/super_admin/auditoria" style="text-decoration: none; color: #374151; font-weight: 500; font-size: 14px; display: block;">
                                    Acessar Auditoria do Sistema
                                    <span style="float: right; color: #9C1E1E;">→</span>
                                  </a>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>

                        <!-- AVISO -->
                        <tr>
                          <td style="padding: 25px 0;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px;">
                              <tr>
                                <td style="padding: 18px 20px;">
                                  <p style="margin: 0 0 10px 0; padding: 0; font-weight: 700; font-size: 14px; color: #92400e;">
                                    ⚠️ PRÓXIMAS AÇÕES RECOMENDADAS
                                  </p>
                                  <p style="margin: 4px 0; padding: 0; font-size: 13px; color: #78350f;">
                                    <span style="font-weight: bold; margin-right: 8px;">→</span>
                                    Confirmar que o novo usuário recebeu o email
                                  </p>
                                  <p style="margin: 4px 0; padding: 0; font-size: 13px; color: #78350f;">
                                    <span style="font-weight: bold; margin-right: 8px;">→</span>
                                    Verificar se o usuário alterou a senha no primeiro acesso
                                  </p>
                                  <p style="margin: 4px 0; padding: 0; font-size: 13px; color: #78350f;">
                                    <span style="font-weight: bold; margin-right: 8px;">→</span>
                                    Monitorar as primeiras atividades no sistema
                                  </p>
                                  <p style="margin: 4px 0; padding: 0; font-size: 13px; color: #78350f;">
                                    <span style="font-weight: bold; margin-right: 8px;">→</span>
                                    Revisar logs de auditoria nas próximas 48h
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>

                        <!-- NOTA FINAL -->
                        <tr>
                          <td>
                            <p style="margin: 0; padding: 0; font-size: 13px; color: #6b7280; line-height: 1.7;">
                              Esta é uma notificação automática do sistema de gerenciamento. 
                              Todas as criações de contas administrativas são registradas e auditadas automaticamente.
                            </p>
                          </td>
                        </tr>

                      </table>
                    </td>
                  </tr>

                  <!-- FOOTER -->
                  <tr>
                    <td style="background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 25px 20px; text-align: center;">
                      <p style="margin: 0; padding: 0; color: #6b7280; font-size: 13px;">
                        Sistema de Notificações Automáticas - EXA Mídia
                      </p>
                      <p style="margin: 10px 0 0 0; padding: 0; color: #9C1E1E; font-size: 13px; font-weight: 700;">
                        © ${new Date().getFullYear()} EXA Mídia
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
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
