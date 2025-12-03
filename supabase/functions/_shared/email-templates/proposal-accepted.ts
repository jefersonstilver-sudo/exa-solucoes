// ============================================
// TEMPLATE EMAIL - PROPOSTA ACEITA
// ============================================

import { createEmailTemplate, EXA_COLORS } from './base.ts';

export interface ProposalAcceptedEmailData {
  clientName: string;
  clientEmail: string;
  clientCnpj?: string;
  proposalNumber: string;
  durationMonths: number;
  fidelMonthlyValue: number;
  cashTotalValue: number;
  discountPercent: number;
  totalPanels: number;
  buildingsCount: number;
  selectedPlan: 'avista' | 'fidelidade';
  sellerName: string;
  sellerPhone: string;
}

export function createProposalAcceptedEmail(data: ProposalAcceptedEmailData): string {
  const fidelTotal = data.fidelMonthlyValue * data.durationMonths;
  const selectedValue = data.selectedPlan === 'avista' ? data.cashTotalValue : fidelTotal;
  const selectedLabel = data.selectedPlan === 'avista' ? 'À Vista' : 'Fidelidade';
  
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const content = `
    <p class="greeting">🎉 Parabéns, ${data.clientName}!</p>
    
    <p class="message">
      Sua proposta comercial foi <strong>aceita com sucesso</strong>! Estamos muito felizes 
      em tê-lo(a) como cliente da EXA Mídia.
    </p>

    <div class="success-box">
      <p>
        ✅ <strong>Proposta ${data.proposalNumber} aceita!</strong><br>
        Opção escolhida: <strong>${selectedLabel}</strong><br>
        Valor: <strong>${formatCurrency(selectedValue)}</strong>
      </p>
    </div>

    <div class="divider"></div>

    <p class="message" style="font-weight: 600; color: ${EXA_COLORS.text};">
      📋 Resumo da sua proposta:
    </p>

    <div class="info-box">
      <p>
        <strong>Cliente:</strong> ${data.clientName}<br>
        ${data.clientCnpj ? `<strong>CNPJ:</strong> ${data.clientCnpj}<br>` : ''}
        <strong>Período:</strong> ${data.durationMonths} ${data.durationMonths === 1 ? 'mês' : 'meses'}<br>
        <strong>Prédios:</strong> ${data.buildingsCount} prédios (${data.totalPanels} telas)<br>
        <br>
        ${data.selectedPlan === 'avista' ? `
          <strong>💰 Valor À Vista:</strong> ${formatCurrency(data.cashTotalValue)} (${data.discountPercent}% de desconto)
        ` : `
          <strong>💳 Valor Mensal:</strong> ${formatCurrency(data.fidelMonthlyValue)}/mês<br>
          <strong>💵 Total Fidelidade:</strong> ${formatCurrency(fidelTotal)}
        `}
      </p>
    </div>

    <div class="divider"></div>

    <p class="message" style="font-weight: 600; color: ${EXA_COLORS.text};">
      📅 Próximos passos:
    </p>

    <div class="info-box">
      <p>
        <strong>1. Contrato</strong><br>
        Em até <strong>1 dia útil</strong>, você receberá o contrato por e-mail para assinatura digital.
        <br><br>
        <strong>2. Assinatura</strong><br>
        Após assinar o contrato, liberaremos seu acesso à plataforma.
        <br><br>
        <strong>3. Login e Senha</strong><br>
        Você receberá suas credenciais de acesso para enviar seus vídeos e acompanhar suas campanhas.
      </p>
    </div>

    <div class="cta-container">
      <a href="https://wa.me/55${data.sellerPhone.replace(/\D/g, '')}" class="cta-button">
        💬 Falar com ${data.sellerName.split(' ')[0]}
      </a>
    </div>

    <div class="divider"></div>

    <p class="message" style="font-size: 14px; text-align: center; color: ${EXA_COLORS.textLight};">
      Obrigado por escolher a <strong>EXA Mídia</strong>!<br>
      Sua publicidade em boas mãos. 🚀
    </p>
  `;

  return createEmailTemplate({
    title: '🎉 Proposta Aceita!',
    subtitle: `Proposta ${data.proposalNumber} confirmada`,
    content,
    footerText: 'Este é um e-mail automático enviado após a aceitação da sua proposta comercial.'
  });
}
