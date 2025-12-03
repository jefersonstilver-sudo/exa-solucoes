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
  // Payment data
  paymentMethod?: 'pix' | 'boleto';
  pixData?: {
    qrCodeBase64?: string;
    qrCode?: string;
  };
  boletoData?: {
    boletoUrl?: string;
    boletoBarcode?: string;
    dueDate?: string;
  };
}

export function createProposalAcceptedEmail(data: ProposalAcceptedEmailData): string {
  const fidelTotal = data.fidelMonthlyValue * data.durationMonths;
  const selectedValue = data.selectedPlan === 'avista' ? data.cashTotalValue : fidelTotal;
  const selectedLabel = data.selectedPlan === 'avista' ? 'À Vista' : 'Fidelidade';
  
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Payment section based on method
  let paymentSection = '';
  
  if (data.paymentMethod === 'pix' && data.pixData) {
    paymentSection = `
      <div class="payment-box" style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); border-radius: 16px; padding: 24px; margin: 20px 0; text-align: center;">
        <h3 style="color: #ffffff; margin: 0 0 16px 0; font-size: 18px;">⚡ Pagamento via PIX</h3>
        
        ${data.pixData.qrCodeBase64 ? `
          <div style="background: #ffffff; border-radius: 12px; padding: 16px; display: inline-block; margin-bottom: 16px;">
            <img src="data:image/png;base64,${data.pixData.qrCodeBase64}" alt="QR Code PIX" style="width: 180px; height: 180px; display: block;" />
          </div>
        ` : ''}
        
        ${data.pixData.qrCode ? `
          <div style="background: rgba(255,255,255,0.15); border-radius: 8px; padding: 12px; margin-top: 12px;">
            <p style="color: #ffffff; font-size: 12px; margin: 0 0 8px 0; font-weight: 600;">Código Pix Copia e Cola:</p>
            <p style="color: #ffffff; font-size: 10px; font-family: monospace; word-break: break-all; margin: 0; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px;">
              ${data.pixData.qrCode.substring(0, 100)}...
            </p>
          </div>
        ` : ''}
      </div>
    `;
  } else if (data.paymentMethod === 'boleto' && data.boletoData) {
    const formattedDueDate = data.boletoData.dueDate 
      ? new Date(data.boletoData.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')
      : 'Em até 3 dias úteis';
    
    paymentSection = `
      <div class="payment-box" style="background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); border-radius: 16px; padding: 24px; margin: 20px 0; text-align: center;">
        <h3 style="color: #ffffff; margin: 0 0 16px 0; font-size: 18px;">📄 Boleto Bancário</h3>
        
        <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 0 0 16px 0;">
          Vencimento: <strong>${formattedDueDate}</strong>
        </p>
        
        ${data.boletoData.boletoUrl ? `
          <a href="${data.boletoData.boletoUrl}" target="_blank" style="display: inline-block; background: #ffffff; color: #1D4ED8; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin-bottom: 16px;">
            📥 Baixar Boleto
          </a>
        ` : ''}
        
        ${data.boletoData.boletoBarcode ? `
          <div style="background: rgba(255,255,255,0.15); border-radius: 8px; padding: 12px; margin-top: 12px;">
            <p style="color: #ffffff; font-size: 12px; margin: 0 0 8px 0; font-weight: 600;">Código de Barras:</p>
            <p style="color: #ffffff; font-size: 11px; font-family: monospace; word-break: break-all; margin: 0; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px;">
              ${data.boletoData.boletoBarcode}
            </p>
          </div>
        ` : ''}
      </div>
    `;
  }

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

    ${paymentSection}

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
        <strong>1. ${data.paymentMethod ? 'Pagamento' : 'Contrato'}</strong><br>
        ${data.paymentMethod 
          ? 'Efetue o pagamento usando os dados acima para liberarmos seu acesso.'
          : 'Em até <strong>1 dia útil</strong>, você receberá o contrato por e-mail para assinatura digital.'
        }
        <br><br>
        <strong>2. ${data.paymentMethod ? 'Confirmação' : 'Assinatura'}</strong><br>
        ${data.paymentMethod
          ? 'Assim que identificarmos o pagamento, enviaremos a confirmação.'
          : 'Após assinar o contrato, liberaremos seu acesso à plataforma.'
        }
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
