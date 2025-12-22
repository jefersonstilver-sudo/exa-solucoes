// ============================================
// TEMPLATES ADMINISTRATIVOS - VERSÃO MINIMALISTA
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
      responsibilities: [],
      firstSteps: [],
      links: [],
      permissions: []
    },
    'admin': {
      name: 'Administrador Geral',
      icon: '🛡️',
      color: '#0EA5E9',
      responsibilities: [],
      firstSteps: [],
      links: [],
      permissions: []
    },
    'admin_marketing': {
      name: 'Administrador de Marketing',
      icon: '🎨',
      color: '#EC4899',
      responsibilities: [],
      firstSteps: [],
      links: [],
      permissions: []
    },
    'admin_financeiro': {
      name: 'Administrador Financeiro',
      icon: '💰',
      color: '#10B981',
      responsibilities: [],
      firstSteps: [],
      links: [],
      permissions: []
    },
    'eletricista_': {
      name: 'Eletricista',
      icon: '⚡',
      color: '#F59E0B',
      responsibilities: [],
      firstSteps: [],
      links: [],
      permissions: []
    },
    'comercial': {
      name: 'Comercial',
      icon: '💼',
      color: '#6366F1',
      responsibilities: [],
      firstSteps: [],
      links: [],
      permissions: []
    },
    'tecnico': {
      name: 'Técnico',
      icon: '🔧',
      color: '#14B8A6',
      responsibilities: [],
      firstSteps: [],
      links: [],
      permissions: []
    }
  };

  // Retornar role específico ou criar um genérico baseado no nome
  if (roleMap[role]) {
    return roleMap[role];
  }

  // Para roles dinâmicos não mapeados, criar um info genérico
  const roleName = role
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());

  return {
    name: roleName,
    icon: '👤',
    color: '#6B7280',
    responsibilities: [],
    firstSteps: [],
    links: [],
    permissions: []
  };
}

// Email de boas-vindas MINIMALISTA para novo admin/colaborador
export function createAdminWelcomeEmail(data: AdminWelcomeEmailData): string {
  const roleInfo = getRoleInfo(data.role);
  
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="display: inline-block; background: rgba(125, 24, 24, 0.1); padding: 12px 28px; border-radius: 50px; border: 2px solid ${EXA_COLORS.primary};">
        <span style="font-size: 24px;">${roleInfo.icon}</span>
        <span style="font-size: 18px; font-weight: 700; color: ${EXA_COLORS.primary}; margin-left: 10px;">${roleInfo.name}</span>
      </div>
    </div>
    
    <h1 class="greeting">Olá, ${data.nome}!</h1>
    
    <p class="message">
      Você recebeu acesso ao sistema da <strong>EXA Mídia</strong> como <strong>${roleInfo.name}</strong>.
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
    
    <div class="cta-container">
      <a href="${data.loginUrl}" class="cta-button">🚀 Fazer Login</a>
    </div>
    
    <div class="warning-box">
      <p><strong>⚠️ Importante</strong></p>
      <p style="margin-top: 8px;">
        Por segurança, altere sua senha no primeiro acesso.
      </p>
    </div>
  `;

  return createEmailTemplate({
    title: 'Bem-vindo à EXA Mídia',
    subtitle: 'Acesso ao Sistema',
    content,
    footerText: 'Este é um email confidencial destinado apenas ao destinatário mencionado.'
  });
}
