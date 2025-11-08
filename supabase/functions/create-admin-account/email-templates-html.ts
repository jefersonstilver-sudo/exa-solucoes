interface AdminWelcomeData {
  nome: string;
  email: string;
  role: string;
  password: string;
  createdBy: string;
  loginUrl: string;
}

interface RoleInfo {
  name: string;
  icon: string;
  color: string;
  bg: string;
  responsibilities: string[];
  firstSteps: string[];
  links: Array<{ label: string; url: string }>;
  permissions: Array<{ feature: string; access: boolean }>;
}

const getRoleInfo = (role: string): RoleInfo => {
  const roleMap: Record<string, RoleInfo> = {
    'super_admin': {
      name: 'Super Administrador',
      icon: '👑',
      color: '#7C3AED',
      bg: '#EDE9FE',
      responsibilities: [
        'Gestão total do sistema e infraestrutura',
        'Criação e gestão de todas as contas administrativas',
        'Acesso a auditoria completa e logs de segurança',
        'Configurações avançadas do sistema'
      ],
      firstSteps: [
        'Fazer login e alterar senha',
        'Revisar painel de auditoria',
        'Verificar integridade do sistema',
        'Revisar configurações de segurança'
      ],
      links: [
        { label: 'Painel de Controle', url: '/super_admin' },
        { label: 'Gerenciar Usuários', url: '/super_admin/usuarios' },
        { label: 'Auditoria', url: '/super_admin/auditoria' }
      ],
      permissions: [
        { feature: 'Dashboard Completo', access: true },
        { feature: 'Criar Admins', access: true },
        { feature: 'Aprovar Vídeos', access: true },
        { feature: 'Gestão Financeira', access: true },
        { feature: 'Marketing e Leads', access: true },
        { feature: 'Auditoria Total', access: true }
      ]
    },
    'admin': {
      name: 'Administrador Geral',
      icon: '🛡️',
      color: '#0EA5E9',
      bg: '#E0F2FE',
      responsibilities: [
        'Gestão completa de prédios e painéis',
        'Aprovação de vídeos e campanhas',
        'Gerenciamento de pedidos e vendas',
        'Relatórios financeiros e operacionais'
      ],
      firstSteps: [
        'Fazer login e alterar senha',
        'Conhecer dashboard de pedidos',
        'Revisar vídeos pendentes de aprovação',
        'Familiarizar-se com gestão de prédios'
      ],
      links: [
        { label: 'Dashboard', url: '/admin' },
        { label: 'Pedidos', url: '/admin/pedidos' },
        { label: 'Aprovar Vídeos', url: '/admin/aprovar-videos' },
        { label: 'Prédios', url: '/admin/predios' }
      ],
      permissions: [
        { feature: 'Dashboard Completo', access: true },
        { feature: 'Criar Admins', access: false },
        { feature: 'Aprovar Vídeos', access: true },
        { feature: 'Gestão Financeira', access: true },
        { feature: 'Marketing e Leads', access: true },
        { feature: 'Auditoria Total', access: false }
      ]
    },
    'admin_marketing': {
      name: 'Administrador de Marketing',
      icon: '🎨',
      color: '#EC4899',
      bg: '#FCE7F3',
      responsibilities: [
        'Gestão de leads (Síndicos, Produtora, Linkae)',
        'Configuração da homepage e banners',
        'Aprovação de conteúdo visual',
        'Campanhas de marketing'
      ],
      firstSteps: [
        'Fazer login e alterar senha',
        'Revisar leads pendentes',
        'Conhecer painel de marketing',
        'Verificar homepage atual'
      ],
      links: [
        { label: 'Dashboard Marketing', url: '/admin/leads' },
        { label: 'Leads Síndicos', url: '/admin/sindicos' },
        { label: 'Configurar Homepage', url: '/admin/homepage' },
        { label: 'Portfólio', url: '/admin/portfolio' }
      ],
      permissions: [
        { feature: 'Dashboard Marketing', access: true },
        { feature: 'Criar Admins', access: false },
        { feature: 'Aprovar Vídeos', access: true },
        { feature: 'Gestão Financeira', access: false },
        { feature: 'Marketing e Leads', access: true },
        { feature: 'Auditoria Total', access: false }
      ]
    },
    'admin_financeiro': {
      name: 'Administrador Financeiro',
      icon: '💰',
      color: '#10B981',
      bg: '#D1FAE5',
      responsibilities: [
        'Análise completa de pedidos e vendas',
        'Gerenciamento de benefícios de prestadores',
        'Relatórios financeiros detalhados',
        'Exportação de dados contábeis'
      ],
      firstSteps: [
        'Fazer login e alterar senha',
        'Conhecer dashboard financeiro',
        'Revisar pedidos recentes',
        'Verificar benefícios de prestadores'
      ],
      links: [
        { label: 'Dashboard Financeiro', url: '/admin/pedidos' },
        { label: 'Benefícios', url: '/admin/beneficios' },
        { label: 'Relatórios', url: '/admin/relatorios' }
      ],
      permissions: [
        { feature: 'Dashboard Financeiro', access: true },
        { feature: 'Criar Admins', access: false },
        { feature: 'Aprovar Vídeos', access: false },
        { feature: 'Gestão Financeira', access: true },
        { feature: 'Marketing e Leads', access: false },
        { feature: 'Auditoria Total', access: false }
      ]
    }
  };

  return roleMap[role] || roleMap['admin'];
};

export const createAdminWelcomeHTML = (data: AdminWelcomeData): string => {
  const roleInfo = getRoleInfo(data.role);
  const currentYear = new Date().getFullYear();

  return `
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
              
              <!-- HEADER -->
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
                        <h1 style="margin: 0; padding: 0; color: #ffffff; font-size: 28px; font-weight: 700; line-height: 1.3;">
                          🎉 Bem-vindo à EXA Mídia!
                        </h1>
                        <p style="margin: 10px 0 20px 0; padding: 0; color: rgba(255,255,255,0.95); font-size: 15px;">
                          Sua conta administrativa foi criada com sucesso
                        </p>
                        <div style="display: inline-block; background: rgba(255,255,255,0.25); padding: 12px 24px; border-radius: 30px; font-size: 18px; font-weight: 600; border: 2px solid rgba(255,255,255,0.4); color: #ffffff;">
                          ${roleInfo.icon} ${roleInfo.name}
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- CONTEÚDO -->
              <tr>
                <td style="padding: 40px 25px;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    
                    <tr>
                      <td style="padding-bottom: 20px;">
                        <p style="margin: 0; padding: 0; font-size: 20px; font-weight: 600; color: #111827;">
                          Olá, ${data.nome}!
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td style="padding-bottom: 30px;">
                        <p style="margin: 0; padding: 0; color: #4b5563; font-size: 15px; line-height: 1.7;">
                          É um prazer tê-lo(a) em nossa equipe! Você acaba de receber acesso administrativo 
                          ao sistema da <strong>EXA Mídia</strong> como <strong>${roleInfo.name}</strong>.
                          ${data.createdBy ? ` Esta conta foi criada por <strong>${data.createdBy}</strong>.` : ''}
                        </p>
                      </td>
                    </tr>

                    <!-- CREDENCIAIS -->
                    <tr>
                      <td style="padding-bottom: 30px;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); border-left: 5px solid #9C1E1E; border-radius: 8px; overflow: hidden;">
                          <tr>
                            <td style="padding: 25px 20px;">
                              <p style="margin: 0 0 15px 0; padding: 0; color: #9C1E1E; font-size: 18px; font-weight: 700;">
                                🔐 Suas Credenciais de Acesso
                              </p>
                              
                              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #ffffff; border-radius: 6px; overflow: hidden; margin-bottom: 12px;">
                                <tr>
                                  <td style="padding: 10px 15px;">
                                    <p style="margin: 0 0 4px 0; padding: 0; font-weight: 600; color: #374151; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">
                                      Email de Acesso
                                    </p>
                                    <p style="margin: 0; padding: 0; color: #111827; font-size: 16px; font-family: 'Courier New', monospace; font-weight: 500;">
                                      ${data.email}
                                    </p>
                                  </td>
                                </tr>
                              </table>

                              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #ffffff; border-radius: 6px; overflow: hidden;">
                                <tr>
                                  <td style="padding: 10px 15px;">
                                    <p style="margin: 0 0 4px 0; padding: 0; font-weight: 600; color: #374151; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">
                                      Senha Temporária
                                    </p>
                                    <p style="margin: 0; padding: 0; color: #111827; font-size: 16px; font-family: 'Courier New', monospace; font-weight: 500;">
                                      ${data.password}
                                    </p>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- AVISO IMPORTANTE -->
                    <tr>
                      <td style="padding-bottom: 25px;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #fef3c7; border-left: 5px solid #f59e0b; border-radius: 8px;">
                          <tr>
                            <td style="padding: 20px;">
                              <p style="margin: 0 0 8px 0; padding: 0; font-weight: 700; font-size: 15px; color: #92400e;">
                                ⚠️ AÇÃO OBRIGATÓRIA
                              </p>
                              <p style="margin: 0; padding: 0; color: #78350f; font-size: 14px; line-height: 1.6;">
                                Por motivos de segurança, você DEVE alterar sua senha no primeiro acesso. 
                                Recomendamos usar uma senha forte com pelo menos 12 caracteres, incluindo 
                                letras maiúsculas, minúsculas, números e caracteres especiais.
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- BOTÃO DE AÇÃO -->
                    <tr>
                      <td style="text-align: center; padding-bottom: 30px;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                          <tr>
                            <td style="background: linear-gradient(135deg, #9C1E1E 0%, #7D1818 100%); border-radius: 8px; box-shadow: 0 4px 15px rgba(156, 30, 30, 0.3);">
                              <a href="${data.loginUrl}" style="display: inline-block; padding: 16px 40px; text-decoration: none; color: #ffffff; font-weight: 600; font-size: 16px;">
                                🚀 Fazer Login Agora
                              </a>
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

                    <!-- RESPONSABILIDADES -->
                    <tr>
                      <td style="padding-bottom: 25px;">
                        <p style="margin: 0 0 15px 0; padding: 0; font-size: 18px; font-weight: 600; color: #111827;">
                          📋 Suas Responsabilidades
                        </p>
                        ${roleInfo.responsibilities.map(resp => `
                          <p style="margin: 0; padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #4b5563;">
                            <span style="color: #9C1E1E; font-weight: bold; margin-right: 8px;">•</span>
                            ${resp}
                          </p>
                        `).join('')}
                      </td>
                    </tr>

                    <!-- PRIMEIROS PASSOS -->
                    <tr>
                      <td style="padding-bottom: 25px;">
                        <p style="margin: 0 0 15px 0; padding: 0; font-size: 18px; font-weight: 600; color: #111827;">
                          ✅ Primeiros Passos
                        </p>
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #f9fafb; border-radius: 8px;">
                          <tr>
                            <td style="padding: 20px;">
                              ${roleInfo.firstSteps.map((step, index) => `
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #ffffff; border-left: 3px solid #9C1E1E; border-radius: 6px; margin-bottom: ${index < roleInfo.firstSteps.length - 1 ? '8px' : '0'};">
                                  <tr>
                                    <td style="padding: 12px;">
                                      <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                        <tr>
                                          <td style="width: 24px; height: 24px; background: #9C1E1E; color: #ffffff; border-radius: 50%; text-align: center; vertical-align: middle; font-size: 12px; font-weight: 600;">
                                            ${index + 1}
                                          </td>
                                          <td style="padding-left: 10px; font-size: 14px; color: #374151;">
                                            ${step}
                                          </td>
                                        </tr>
                                      </table>
                                    </td>
                                  </tr>
                                </table>
                              `).join('')}
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- LINKS RÁPIDOS -->
                    <tr>
                      <td style="padding-bottom: 25px;">
                        <p style="margin: 0 0 15px 0; padding: 0; font-size: 18px; font-weight: 600; color: #111827;">
                          🔗 Acesso Rápido às Funcionalidades
                        </p>
                        ${roleInfo.links.map(link => `
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #ffffff; border: 2px solid #e5e7eb; border-radius: 8px; margin-bottom: 10px;">
                            <tr>
                              <td style="padding: 15px 20px;">
                                <a href="${data.loginUrl.replace('/login', link.url)}" style="text-decoration: none; color: #374151; font-weight: 500; font-size: 14px; display: block;">
                                  ${link.label}
                                  <span style="float: right; color: #9C1E1E; font-weight: bold;">→</span>
                                </a>
                              </td>
                            </tr>
                          </table>
                        `).join('')}
                      </td>
                    </tr>

                    <!-- PERMISSÕES -->
                    <tr>
                      <td style="padding-bottom: 25px;">
                        <p style="margin: 0 0 15px 0; padding: 0; font-size: 18px; font-weight: 600; color: #111827;">
                          🔒 Suas Permissões de Acesso
                        </p>
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                          <thead>
                            <tr style="background: #f9fafb;">
                              <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; font-size: 14px; border-bottom: 2px solid #e5e7eb;">
                                Funcionalidade
                              </th>
                              <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; font-size: 14px; border-bottom: 2px solid #e5e7eb;">
                                Acesso
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            ${roleInfo.permissions.map(perm => `
                              <tr>
                                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #4b5563;">
                                  ${perm.feature}
                                </td>
                                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; font-weight: 600; color: ${perm.access ? '#10b981' : '#ef4444'};">
                                  ${perm.access ? '✅ Completo' : '❌ Restrito'}
                                </td>
                              </tr>
                            `).join('')}
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    ${data.role === 'admin_financeiro' ? `
                      <tr>
                        <td style="padding-bottom: 25px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #dbeafe; border-left: 5px solid #3b82f6; border-radius: 8px;">
                            <tr>
                              <td style="padding: 20px;">
                                <p style="margin: 0 0 8px 0; padding: 0; font-weight: 700; font-size: 15px; color: #1e40af;">
                                  📝 IMPORTANTE - Auditoria
                                </p>
                                <p style="margin: 0; padding: 0; color: #1e3a8a; font-size: 14px; line-height: 1.6;">
                                  Todas as suas ações são registradas automaticamente no sistema de auditoria 
                                  para garantir segurança, conformidade e rastreabilidade completa das operações financeiras.
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    ` : ''}

                    <!-- NOTA FINAL -->
                    <tr>
                      <td>
                        <div style="height: 1px; background: linear-gradient(to right, transparent, #e5e7eb, transparent); margin: 20px 0;"></div>
                        <p style="margin: 0 0 25px 0; padding: 0; font-size: 14px; color: #6b7280; line-height: 1.7;">
                          Caso tenha alguma dúvida sobre suas responsabilidades, permissões ou 
                          funcionalidades do sistema, entre em contato com a equipe de TI ou 
                          com o administrador que criou sua conta.
                        </p>
                        <p style="margin: 0; padding: 0; font-size: 15px; color: #374151;">
                          Atenciosamente,<br>
                          <strong style="color: #9C1E1E;">Equipe EXA Mídia</strong>
                        </p>
                      </td>
                    </tr>

                  </table>
                </td>
              </tr>

              <!-- FOOTER -->
              <tr>
                <td style="background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 30px 20px; text-align: center;">
                  <p style="margin: 0; padding: 0; color: #6b7280; font-size: 13px;">
                    Este é um email automático. Por favor, não responda.
                  </p>
                  <p style="margin: 8px 0 0 0; padding: 0; color: #6b7280; font-size: 13px;">
                    Em caso de dúvidas, entre em contato com o suporte técnico.
                  </p>
                  <p style="margin: 15px 0 0 0; padding: 0; color: #9C1E1E; font-size: 13px; font-weight: 700;">
                    © ${currentYear} EXA Mídia. Todos os direitos reservados.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};
