// ============================================
// TEMPLATES ADMINISTRATIVOS
// ============================================

import { createEmailTemplate, EXA_COLORS } from './base.ts';
import type { AdminWelcomeEmailData, RoleInfo } from './types.ts';

// Informações de cada role administrativo
function getRoleInfo(role: string): RoleInfo {
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

// Email de boas-vindas para novo admin
export function createAdminWelcomeEmail(data: AdminWelcomeEmailData): string {
  const roleInfo = getRoleInfo(data.role);
  const currentYear = new Date().getFullYear();
  
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="display: inline-block; background: rgba(125, 24, 24, 0.1); padding: 12px 28px; border-radius: 50px; border: 2px solid ${EXA_COLORS.primary};">
        <span style="font-size: 24px;">${roleInfo.icon}</span>
        <span style="font-size: 18px; font-weight: 700; color: ${EXA_COLORS.primary}; margin-left: 10px;">${roleInfo.name}</span>
      </div>
    </div>
    
    <h1 class="greeting">Olá, ${data.nome}!</h1>
    
    <p class="message">
      É um prazer tê-lo(a) em nossa equipe! Você acaba de receber acesso administrativo ao sistema da 
      <strong>EXA Mídia</strong> como <strong>${roleInfo.name}</strong>.
      ${data.createdBy ? ` Esta conta foi criada por <strong>${data.createdBy}</strong>.` : ''}
    </p>
    
    <!-- CREDENCIAIS -->
    <div style="background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); border-left: 5px solid ${EXA_COLORS.primary}; border-radius: 8px; padding: 25px 20px; margin: 30px 0;">
      <h3 style="color: ${EXA_COLORS.primary}; font-size: 18px; margin: 0 0 15px 0;">
        🔐 Suas Credenciais de Acesso
      </h3>
      <div style="margin: 12px 0; padding: 10px; background: white; border-radius: 6px;">
        <span style="display: block; font-weight: 600; color: #374151; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Email de Acesso</span>
        <span style="color: #111827; font-size: 16px; font-family: 'Courier New', monospace; font-weight: 500;">${data.email}</span>
      </div>
      <div style="margin: 12px 0; padding: 10px; background: white; border-radius: 6px;">
        <span style="display: block; font-weight: 600; color: #374151; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Senha Temporária</span>
        <span style="color: #111827; font-size: 16px; font-family: 'Courier New', monospace; font-weight: 500;">${data.password}</span>
      </div>
    </div>
    
    <div class="warning-box">
      <p><strong>⚠️ AÇÃO OBRIGATÓRIA</strong></p>
      <p style="margin-top: 8px;">
        Por motivos de segurança, você <strong>DEVE alterar sua senha no primeiro acesso</strong>. 
        Recomendamos usar uma senha forte com pelo menos 12 caracteres, incluindo letras maiúsculas, 
        minúsculas, números e caracteres especiais.
      </p>
    </div>
    
    <div class="cta-container">
      <a href="${data.loginUrl}" class="cta-button">🚀 Fazer Login Agora</a>
    </div>
    
    <div class="divider"></div>
    
    <!-- RESPONSABILIDADES -->
    <div style="margin: 35px 0;">
      <h3 style="font-size: 18px; color: #111827; font-weight: 600; margin-bottom: 15px;">
        📋 Suas Responsabilidades
      </h3>
      ${roleInfo.responsibilities.map(resp => `
        <div style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #4b5563;">
          <span style="color: ${EXA_COLORS.primary}; font-weight: bold; margin-right: 8px;">•</span>${resp}
        </div>
      `).join('')}
    </div>
    
    <!-- PRIMEIROS PASSOS -->
    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 35px 0;">
      <h3 style="font-size: 18px; color: #111827; font-weight: 600; margin-bottom: 15px;">
        ✓ Primeiros Passos
      </h3>
      ${roleInfo.firstSteps.map((step, index) => `
        <div style="padding: 12px; background: white; margin: 8px 0; border-radius: 6px; border-left: 3px solid ${EXA_COLORS.primary};">
          <span style="display: inline-block; background: ${EXA_COLORS.primary}; color: white; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 600; margin-right: 10px;">${index + 1}</span>
          <span style="font-size: 14px; color: #374151;">${step}</span>
        </div>
      `).join('')}
    </div>
    
    <!-- LINKS RÁPIDOS -->
    <div style="margin: 35px 0;">
      <h3 style="font-size: 18px; color: #111827; font-weight: 600; margin-bottom: 15px;">
        🔗 Links Rápidos
      </h3>
      ${roleInfo.links.map(link => `
        <a href="${link.url}" style="display: block; background: white; border: 2px solid #e5e7eb; padding: 15px 20px; text-decoration: none; color: #374151; border-radius: 8px; margin: 10px 0; font-size: 14px; font-weight: 500;">
          ${link.label}
          <span style="float: right; color: ${EXA_COLORS.primary}; font-weight: bold;">→</span>
        </a>
      `).join('')}
    </div>
    
    <!-- PERMISSÕES -->
    <div style="margin: 35px 0;">
      <h3 style="font-size: 18px; color: #111827; font-weight: 600; margin-bottom: 15px;">
        🔑 Suas Permissões
      </h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <thead>
          <tr style="background: #f9fafb;">
            <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Funcionalidade</th>
            <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Acesso</th>
          </tr>
        </thead>
        <tbody>
          ${roleInfo.permissions.map(perm => `
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${perm.feature}</td>
              <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
                <span style="color: ${perm.access ? '#10b981' : '#ef4444'}; font-weight: 600;">
                  ${perm.access ? '✓ Sim' : '✗ Não'}
                </span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  return createEmailTemplate({
    title: '🎉 Bem-vindo à Equipe EXA!',
    subtitle: 'Acesso Administrativo Criado',
    content,
    footerText: 'Este é um email confidencial destinado apenas ao destinatário mencionado.'
  });
}
