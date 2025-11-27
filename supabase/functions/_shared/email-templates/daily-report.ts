// ============================================
// EMAIL TEMPLATE: RELATÓRIO DIÁRIO
// ============================================

import { createEmailTemplate, EXA_LOGO_URL, EXA_COLORS } from './base.ts';

export interface DailyReportEmailData {
  reportDate: string;
  agentName: string;
  metrics: {
    firstMessageTime: string;
    lastMessageTime: string;
    totalConversations: number;
    messagesSent: number;
    messagesReceived: number;
    avgResponseTime: string;
  };
  contactsByType: Array<{
    type: string;
    count: number;
    messagesSent: number;
    messagesReceived: number;
    percentage: number;
  }>;
  periodDistribution: {
    morning: {
      messagesSent: number;
      contactsAttended: number;
      avgResponseTime: string;
      topContactType: string;
    };
    afternoon: {
      messagesSent: number;
      contactsAttended: number;
      avgResponseTime: string;
      topContactType: string;
    };
    night: {
      messagesSent: number;
      contactsAttended: number;
      avgResponseTime: string;
      topContactType: string;
    };
  };
  hotLeads: Array<{
    name: string;
    type: string;
    score: number;
    keyPoints: string;
  }>;
  dailyScore: number;
  alerts: string[];
  opportunities: {
    exploited: number;
    inProgress: number;
    lost: number;
  };
}

export function createDailyReportEmail(data: DailyReportEmailData): string {
  const content = `
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
      <img src="${EXA_LOGO_URL}" alt="EXA" style="height: 50px; margin-bottom: 16px;" />
      <h1 style="color: white; font-size: 28px; font-weight: bold; margin: 0 0 8px 0;">
        📊 Relatório Diário
      </h1>
      <p style="color: rgba(255, 255, 255, 0.9); font-size: 16px; margin: 0;">
        ${data.reportDate} • Agente ${data.agentName}
      </p>
    </div>

    <!-- Resumo do Dia -->
    <div style="background: #f8f9fa; padding: 24px; margin: 24px 0; border-radius: 12px; border-left: 4px solid ${EXA_COLORS.primary};">
      <h2 style="color: #1a202c; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">
        📈 Resumo do Dia
      </h2>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
        <div>
          <p style="color: #718096; font-size: 12px; margin: 0 0 4px 0;">🕐 Primeira mensagem</p>
          <p style="color: #2d3748; font-size: 16px; font-weight: 600; margin: 0;">${data.metrics.firstMessageTime}</p>
        </div>
        <div>
          <p style="color: #718096; font-size: 12px; margin: 0 0 4px 0;">📤 Enviadas</p>
          <p style="color: #2d3748; font-size: 16px; font-weight: 600; margin: 0;">${data.metrics.messagesSent}</p>
        </div>
        <div>
          <p style="color: #718096; font-size: 12px; margin: 0 0 4px 0;">🕙 Última mensagem</p>
          <p style="color: #2d3748; font-size: 16px; font-weight: 600; margin: 0;">${data.metrics.lastMessageTime}</p>
        </div>
        <div>
          <p style="color: #718096; font-size: 12px; margin: 0 0 4px 0;">📥 Recebidas</p>
          <p style="color: #2d3748; font-size: 16px; font-weight: 600; margin: 0;">${data.metrics.messagesReceived}</p>
        </div>
        <div>
          <p style="color: #718096; font-size: 12px; margin: 0 0 4px 0;">💬 Total conversas</p>
          <p style="color: #2d3748; font-size: 16px; font-weight: 600; margin: 0;">${data.metrics.totalConversations}</p>
        </div>
        <div>
          <p style="color: #718096; font-size: 12px; margin: 0 0 4px 0;">⏱️ Tempo médio</p>
          <p style="color: #2d3748; font-size: 16px; font-weight: 600; margin: 0;">${data.metrics.avgResponseTime}</p>
        </div>
      </div>
    </div>

    <!-- Contatos por Tipo -->
    <div style="margin: 24px 0;">
      <h2 style="color: #1a202c; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">
        👥 Contatos por Tipo (ordenado por volume)
      </h2>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #f7fafc; border-bottom: 2px solid #e2e8f0;">
            <th style="padding: 12px; text-align: left; color: #4a5568; font-size: 12px; font-weight: 600;">Tipo</th>
            <th style="padding: 12px; text-align: center; color: #4a5568; font-size: 12px; font-weight: 600;">Contatos</th>
            <th style="padding: 12px; text-align: center; color: #4a5568; font-size: 12px; font-weight: 600;">Enviadas</th>
            <th style="padding: 12px; text-align: center; color: #4a5568; font-size: 12px; font-weight: 600;">Recebidas</th>
            <th style="padding: 12px; text-align: center; color: #4a5568; font-size: 12px; font-weight: 600;">%</th>
          </tr>
        </thead>
        <tbody>
          ${data.contactsByType.map((contact, index) => `
            <tr style="border-bottom: 1px solid #e2e8f0; ${index === 0 ? 'background: #f0fff4;' : ''}">
              <td style="padding: 12px; color: #2d3748; font-weight: ${index === 0 ? '600' : '500'};">${contact.type}</td>
              <td style="padding: 12px; text-align: center; color: #2d3748;">${contact.count}</td>
              <td style="padding: 12px; text-align: center; color: #2d3748;">${contact.messagesSent}</td>
              <td style="padding: 12px; text-align: center; color: #2d3748;">${contact.messagesReceived}</td>
              <td style="padding: 12px; text-align: center; color: #2d3748; font-weight: 600;">${contact.percentage}%</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Distribuição por Período -->
    <div style="margin: 24px 0;">
      <h2 style="color: #1a202c; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">
        🕐 Distribuição por Período do Dia
      </h2>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
        <!-- Manhã -->
        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%); padding: 16px; border-radius: 8px;">
          <h3 style="color: #78350f; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">☀️ Manhã (06-12h)</h3>
          <div style="space-y: 8px;">
            <p style="color: #78350f; font-size: 12px; margin: 4px 0;">Mensagens: <strong>${data.periodDistribution.morning.messagesSent}</strong></p>
            <p style="color: #78350f; font-size: 12px; margin: 4px 0;">Contatos: <strong>${data.periodDistribution.morning.contactsAttended}</strong></p>
            <p style="color: #78350f; font-size: 12px; margin: 4px 0;">T. médio: <strong>${data.periodDistribution.morning.avgResponseTime}</strong></p>
            <p style="color: #78350f; font-size: 11px; margin: 4px 0; opacity: 0.8;">Tipo +: ${data.periodDistribution.morning.topContactType}</p>
          </div>
        </div>
        
        <!-- Tarde -->
        <div style="background: linear-gradient(135deg, #fed7aa 0%, #fb923c 100%); padding: 16px; border-radius: 8px;">
          <h3 style="color: #7c2d12; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">🌤️ Tarde (12-18h)</h3>
          <div style="space-y: 8px;">
            <p style="color: #7c2d12; font-size: 12px; margin: 4px 0;">Mensagens: <strong>${data.periodDistribution.afternoon.messagesSent}</strong></p>
            <p style="color: #7c2d12; font-size: 12px; margin: 4px 0;">Contatos: <strong>${data.periodDistribution.afternoon.contactsAttended}</strong></p>
            <p style="color: #7c2d12; font-size: 12px; margin: 4px 0;">T. médio: <strong>${data.periodDistribution.afternoon.avgResponseTime}</strong></p>
            <p style="color: #7c2d12; font-size: 11px; margin: 4px 0; opacity: 0.8;">Tipo +: ${data.periodDistribution.afternoon.topContactType}</p>
          </div>
        </div>
        
        <!-- Noite -->
        <div style="background: linear-gradient(135deg, #ddd6fe 0%, #8b5cf6 100%); padding: 16px; border-radius: 8px;">
          <h3 style="color: #4c1d95; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">🌙 Noite (18-00h)</h3>
          <div style="space-y: 8px;">
            <p style="color: #4c1d95; font-size: 12px; margin: 4px 0;">Mensagens: <strong>${data.periodDistribution.night.messagesSent}</strong></p>
            <p style="color: #4c1d95; font-size: 12px; margin: 4px 0;">Contatos: <strong>${data.periodDistribution.night.contactsAttended}</strong></p>
            <p style="color: #4c1d95; font-size: 12px; margin: 4px 0;">T. médio: <strong>${data.periodDistribution.night.avgResponseTime}</strong></p>
            <p style="color: #4c1d95; font-size: 11px; margin: 4px 0; opacity: 0.8;">Tipo +: ${data.periodDistribution.night.topContactType}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Hot Leads -->
    ${data.hotLeads.length > 0 ? `
      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%); padding: 20px; border-radius: 12px; margin: 24px 0;">
        <h2 style="color: #78350f; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">
          🔥 Hot Leads Identificados
        </h2>
        ${data.hotLeads.map((lead, index) => `
          <div style="background: white; padding: 16px; border-radius: 8px; margin-bottom: ${index < data.hotLeads.length - 1 ? '12px' : '0'};">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <h3 style="color: #1a202c; font-size: 16px; font-weight: 600; margin: 0;">${lead.name}</h3>
              <span style="background: #10b981; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                Score: ${lead.score}/100
              </span>
            </div>
            <p style="color: #718096; font-size: 13px; margin: 4px 0;">Tipo: <strong>${lead.type}</strong></p>
            <p style="color: #4a5568; font-size: 13px; margin: 8px 0 0 0;">${lead.keyPoints}</p>
          </div>
        `).join('')}
      </div>
    ` : ''}

    <!-- Alertas -->
    ${data.alerts.length > 0 ? `
      <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; border-radius: 8px; margin: 24px 0;">
        <h2 style="color: #991b1b; font-size: 18px; font-weight: 600; margin: 0 0 12px 0;">
          ⚠️ Alertas e Atenções
        </h2>
        <ul style="margin: 0; padding-left: 20px;">
          ${data.alerts.map(alert => `
            <li style="color: #7f1d1d; font-size: 14px; margin: 8px 0;">${alert}</li>
          `).join('')}
        </ul>
      </div>
    ` : ''}

    <!-- Oportunidades -->
    <div style="margin: 24px 0;">
      <h2 style="color: #1a202c; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">
        🎯 Oportunidades
      </h2>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
        <div style="text-align: center; padding: 16px; background: #d1fae5; border-radius: 8px;">
          <p style="color: #065f46; font-size: 32px; font-weight: bold; margin: 0;">${data.opportunities.exploited}</p>
          <p style="color: #065f46; font-size: 12px; margin: 4px 0 0 0;">Aproveitadas</p>
        </div>
        <div style="text-align: center; padding: 16px; background: #fef3c7; border-radius: 8px;">
          <p style="color: #78350f; font-size: 32px; font-weight: bold; margin: 0;">${data.opportunities.inProgress}</p>
          <p style="color: #78350f; font-size: 12px; margin: 4px 0 0 0;">Em Andamento</p>
        </div>
        <div style="text-align: center; padding: 16px; background: #fee2e2; border-radius: 8px;">
          <p style="color: #991b1b; font-size: 32px; font-weight: bold; margin: 0;">${data.opportunities.lost}</p>
          <p style="color: #991b1b; font-size: 12px; margin: 4px 0 0 0;">Perdidas</p>
        </div>
      </div>
    </div>

    <!-- Score do Dia -->
    <div style="text-align: center; padding: 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; margin: 24px 0;">
      <p style="color: rgba(255, 255, 255, 0.9); font-size: 14px; margin: 0 0 8px 0;">SCORE DO DIA</p>
      <p style="color: white; font-size: 56px; font-weight: bold; margin: 0; line-height: 1;">${data.dailyScore}<span style="font-size: 32px; opacity: 0.8;">/100</span></p>
      <div style="background: rgba(255, 255, 255, 0.2); height: 8px; border-radius: 4px; margin: 16px auto 0 auto; max-width: 200px; overflow: hidden;">
        <div style="background: white; height: 100%; width: ${data.dailyScore}%; border-radius: 4px;"></div>
      </div>
    </div>

    <div style="background: #f7fafc; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0;">
      <p style="color: #718096; font-size: 12px; margin: 0;">
        📊 Este relatório foi gerado automaticamente pelo sistema EXA IA
      </p>
      <p style="color: #718096; font-size: 12px; margin: 4px 0 0 0;">
        Para acessar relatórios completos e históricos, acesse o painel administrativo
      </p>
    </div>
  `;

  return createEmailTemplate({
    content,
    preheader: `Relatório diário de ${data.agentName} - ${data.reportDate}`
  });
}
