
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
  responsibilities: string[];
  firstSteps: string[];
  links: Array<{ label: string; url: string }>;
  permissions: Array<{ feature: string; access: boolean }>;
}

export class AdminEmailTemplates {
  private static getRoleInfo(role: string): RoleInfo {
    const roleMap: Record<string, RoleInfo> = {
      'super_admin': {
        name: 'Super Administrador',
        icon: '👑',
        color: '#7C3AED',
        responsibilities: [
          'Gestão total do sistema e infraestrutura',
          'Criação e gestão de todas as contas administrativas',
          'Acesso a auditoria completa e logs de segurança',
          'Configurações avançadas do sistema',
          'Monitoramento de integridade dos dados'
        ],
        firstSteps: [
          'Fazer login e alterar senha',
          'Revisar painel de auditoria',
          'Verificar integridade do sistema',
          'Revisar configurações de segurança',
          'Conhecer equipe administrativa atual'
        ],
        links: [
          { label: 'Painel de Controle', url: '/super_admin' },
          { label: 'Gerenciar Usuários', url: '/super_admin/usuarios' },
          { label: 'Auditoria', url: '/super_admin/auditoria' },
          { label: 'Logs do Sistema', url: '/super_admin/logs' }
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
        responsibilities: [
          'Gestão completa de prédios e painéis',
          'Aprovação de vídeos e campanhas',
          'Gerenciamento de pedidos e vendas',
          'Relatórios financeiros e operacionais',
          'Suporte a clientes'
        ],
        firstSteps: [
          'Fazer login e alterar senha',
          'Conhecer dashboard de pedidos',
          'Revisar vídeos pendentes de aprovação',
          'Familiarizar-se com gestão de prédios',
          'Verificar campanhas ativas'
        ],
        links: [
          { label: 'Dashboard', url: '/admin' },
          { label: 'Pedidos', url: '/admin/pedidos' },
          { label: 'Aprovar Vídeos', url: '/admin/aprovar-videos' },
          { label: 'Prédios', url: '/admin/predios' },
          { label: 'Painéis', url: '/admin/paineis' }
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
        responsibilities: [
          'Gestão de leads (Síndicos, Produtora, Linkae)',
          'Configuração da homepage e banners',
          'Aprovação de conteúdo visual',
          'Gerenciamento de logos de clientes',
          'Campanhas de marketing'
        ],
        firstSteps: [
          'Fazer login e alterar senha',
          'Revisar leads pendentes',
          'Conhecer painel de marketing',
          'Verificar homepage atual',
          'Familiarizar-se com portfólio'
        ],
        links: [
          { label: 'Dashboard Marketing', url: '/admin/leads' },
          { label: 'Leads Síndicos', url: '/admin/sindicos' },
          { label: 'Configurar Homepage', url: '/admin/homepage' },
          { label: 'Portfólio', url: '/admin/portfolio' },
          { label: 'Logos de Clientes', url: '/admin/client-logos' }
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
        responsibilities: [
          'Análise completa de pedidos e vendas',
          'Gerenciamento de benefícios de prestadores',
          'Relatórios financeiros detalhados',
          'Exportação de dados contábeis',
          'Monitoramento de receitas'
        ],
        firstSteps: [
          'Fazer login e alterar senha',
          'Conhecer dashboard financeiro',
          'Revisar pedidos recentes',
          'Verificar benefícios de prestadores',
          'Explorar relatórios disponíveis'
        ],
        links: [
          { label: 'Dashboard Financeiro', url: '/admin/pedidos' },
          { label: 'Benefícios', url: '/admin/beneficios' },
          { label: 'Relatórios', url: '/admin/relatorios' },
          { label: 'Exportar Dados', url: '/admin/exportar' }
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
  }

  static createAdminWelcomeHTML(data: AdminWelcomeData): string {
    const roleInfo = this.getRoleInfo(data.role);
    const currentYear = new Date().getFullYear();

    return `
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
            max-width: 600px; 
            margin: 0 auto; 
            background: white;
          }
          .header { 
            background: linear-gradient(135deg, #9C1E1E 0%, #7D1818 100%); 
            color: white; 
            padding: 40px 30px; 
            text-align: center;
          }
          .header h1 { 
            font-size: 28px; 
            font-weight: 700;
            margin-bottom: 10px;
          }
          .header p { 
            font-size: 16px; 
            opacity: 0.95;
          }
          .role-badge {
            display: inline-block;
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            padding: 12px 24px;
            border-radius: 30px;
            margin-top: 20px;
            font-size: 18px;
            font-weight: 600;
            border: 2px solid rgba(255, 255, 255, 0.3);
          }
          .content { 
            padding: 40px 30px;
            background: white;
          }
          .greeting {
            font-size: 20px;
            color: #111827;
            margin-bottom: 20px;
            font-weight: 600;
          }
          .intro-text {
            font-size: 15px;
            color: #4b5563;
            margin-bottom: 30px;
            line-height: 1.7;
          }
          .credentials-box { 
            background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
            padding: 25px;
            border-left: 5px solid #9C1E1E;
            margin: 30px 0;
            border-radius: 8px;
          }
          .credentials-box h3 {
            color: #9C1E1E;
            font-size: 18px;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .credential-item { 
            margin: 12px 0;
            padding: 10px;
            background: white;
            border-radius: 6px;
          }
          .credential-label { 
            font-weight: 600;
            color: #374151;
            display: block;
            margin-bottom: 4px;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .credential-value {
            color: #111827;
            font-size: 16px;
            font-family: 'Courier New', monospace;
            font-weight: 500;
          }
          .section {
            margin: 35px 0;
          }
          .section-title {
            font-size: 18px;
            color: #111827;
            font-weight: 600;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .list-item {
            padding: 10px 0;
            border-bottom: 1px solid #e5e7eb;
            font-size: 14px;
            color: #4b5563;
          }
          .list-item:last-child {
            border-bottom: none;
          }
          .list-item::before {
            content: "•";
            color: #9C1E1E;
            font-weight: bold;
            display: inline-block;
            width: 1em;
            margin-right: 8px;
          }
          .steps-checklist {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
          }
          .step-item {
            padding: 12px;
            background: white;
            margin: 8px 0;
            border-radius: 6px;
            border-left: 3px solid #9C1E1E;
            font-size: 14px;
            color: #374151;
          }
          .step-number {
            display: inline-block;
            background: #9C1E1E;
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            text-align: center;
            line-height: 24px;
            font-size: 12px;
            font-weight: 600;
            margin-right: 10px;
          }
          .links-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 10px;
            margin-top: 15px;
          }
          .link-button {
            display: block;
            background: white;
            border: 2px solid #e5e7eb;
            padding: 15px 20px;
            text-decoration: none;
            color: #374151;
            border-radius: 8px;
            transition: all 0.3s;
            text-align: left;
            font-size: 14px;
            font-weight: 500;
          }
          .link-button:hover {
            border-color: #9C1E1E;
            background: #fef2f2;
          }
          .link-arrow {
            float: right;
            color: #9C1E1E;
            font-weight: bold;
          }
          .permissions-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            font-size: 14px;
          }
          .permissions-table th {
            background: #f9fafb;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            color: #374151;
            border-bottom: 2px solid #e5e7eb;
          }
          .permissions-table td {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
          }
          .access-yes {
            color: #10b981;
            font-weight: 600;
          }
          .access-no {
            color: #ef4444;
            font-weight: 600;
          }
          .warning-box { 
            background: #fef3c7;
            border-left: 5px solid #f59e0b;
            padding: 20px;
            margin: 25px 0;
            border-radius: 8px;
          }
          .warning-box strong {
            display: block;
            color: #92400e;
            font-size: 15px;
            margin-bottom: 8px;
          }
          .warning-box p {
            color: #78350f;
            font-size: 14px;
            margin: 0;
          }
          .security-box {
            background: #dbeafe;
            border-left: 5px solid #3b82f6;
            padding: 20px;
            margin: 25px 0;
            border-radius: 8px;
          }
          .security-box strong {
            display: block;
            color: #1e40af;
            font-size: 15px;
            margin-bottom: 8px;
          }
          .security-box p {
            color: #1e3a8a;
            font-size: 14px;
            margin: 0;
          }
          .cta-button { 
            display: inline-block;
            background: linear-gradient(135deg, #9C1E1E 0%, #7D1818 100%);
            color: white !important;
            padding: 16px 40px;
            text-decoration: none;
            border-radius: 8px;
            margin: 25px 0;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 15px rgba(156, 30, 30, 0.3);
            transition: all 0.3s;
          }
          .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(156, 30, 30, 0.4);
          }
          .footer { 
            text-align: center;
            color: #6b7280;
            padding: 30px;
            font-size: 13px;
            background: #f9fafb;
            border-top: 1px solid #e5e7eb;
          }
          .footer p {
            margin: 5px 0;
          }
          .footer-brand {
            font-weight: 600;
            color: #9C1E1E;
            margin-top: 15px;
          }
          .divider {
            height: 1px;
            background: linear-gradient(to right, transparent, #e5e7eb, transparent);
            margin: 30px 0;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>🎉 Bem-vindo à EXA Mídia!</h1>
            <p>Sua conta administrativa foi criada com sucesso</p>
            <div class="role-badge">
              ${roleInfo.icon} ${roleInfo.name}
            </div>
          </div>
          
          <div class="content">
            <div class="greeting">Olá, ${data.nome}!</div>
            
            <p class="intro-text">
              É um prazer tê-lo(a) em nossa equipe! Você acaba de receber acesso administrativo 
              ao sistema da <strong>EXA Mídia</strong> como <strong>${roleInfo.name}</strong>.
              ${data.createdBy ? ` Esta conta foi criada por <strong>${data.createdBy}</strong>.` : ''}
            </p>

            <div class="credentials-box">
              <h3>🔐 Suas Credenciais de Acesso</h3>
              <div class="credential-item">
                <span class="credential-label">Email de Acesso</span>
                <span class="credential-value">${data.email}</span>
              </div>
              <div class="credential-item">
                <span class="credential-label">Senha Temporária</span>
                <span class="credential-value">${data.password}</span>
              </div>
            </div>

            <div class="warning-box">
              <strong>⚠️ AÇÃO OBRIGATÓRIA</strong>
              <p>Por motivos de segurança, você DEVE alterar sua senha no primeiro acesso. 
              Recomendamos usar uma senha forte com pelo menos 12 caracteres, incluindo 
              letras maiúsculas, minúsculas, números e caracteres especiais.</p>
            </div>

            <div style="text-align: center;">
              <a href="${data.loginUrl}" class="cta-button">
                🚀 Fazer Login Agora
              </a>
            </div>

            <div class="divider"></div>

            <div class="section">
              <div class="section-title">📋 Suas Responsabilidades</div>
              ${roleInfo.responsibilities.map(resp => `
                <div class="list-item">${resp}</div>
              `).join('')}
            </div>

            <div class="section">
              <div class="section-title">✅ Primeiros Passos</div>
              <div class="steps-checklist">
                ${roleInfo.firstSteps.map((step, index) => `
                  <div class="step-item">
                    <span class="step-number">${index + 1}</span>
                    ${step}
                  </div>
                `).join('')}
              </div>
            </div>

            <div class="section">
              <div class="section-title">🔗 Acesso Rápido às Funcionalidades</div>
              <div class="links-grid">
                ${roleInfo.links.map(link => `
                  <a href="${data.loginUrl.replace('/login', link.url)}" class="link-button">
                    ${link.label}
                    <span class="link-arrow">→</span>
                  </a>
                `).join('')}
              </div>
            </div>

            <div class="section">
              <div class="section-title">🔒 Suas Permissões de Acesso</div>
              <table class="permissions-table">
                <thead>
                  <tr>
                    <th>Funcionalidade</th>
                    <th>Acesso</th>
                  </tr>
                </thead>
                <tbody>
                  ${roleInfo.permissions.map(perm => `
                    <tr>
                      <td>${perm.feature}</td>
                      <td class="${perm.access ? 'access-yes' : 'access-no'}">
                        ${perm.access ? '✅ Completo' : '❌ Restrito'}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            ${data.role === 'admin_financeiro' ? `
              <div class="security-box">
                <strong>📝 IMPORTANTE - Auditoria</strong>
                <p>Todas as suas ações são registradas automaticamente no sistema de auditoria 
                para garantir segurança, conformidade e rastreabilidade completa das operações financeiras.</p>
              </div>
            ` : ''}

            <div class="divider"></div>

            <p style="font-size: 14px; color: #6b7280; line-height: 1.7;">
              Caso tenha alguma dúvida sobre suas responsabilidades, permissões ou 
              funcionalidades do sistema, entre em contato com a equipe de TI ou 
              com o administrador que criou sua conta.
            </p>

            <p style="font-size: 15px; color: #374151; margin-top: 25px;">
              Atenciosamente,<br>
              <strong style="color: #9C1E1E;">Equipe EXA Mídia</strong>
            </p>
          </div>
          
          <div class="footer">
            <p>Este é um email automático. Por favor, não responda.</p>
            <p>Em caso de dúvidas, entre em contato com o suporte técnico.</p>
            <p class="footer-brand">© ${currentYear} EXA Mídia. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
