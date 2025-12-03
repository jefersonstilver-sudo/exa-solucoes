// ============================================
// TEMPLATE EMAIL - PROPOSTA ACEITA
// Estilo corporativo limpo com breakdown de descontos
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
  // NEW: Discount breakdown data
  fullMonthlyPrice?: number;
  fullTotalPrice?: number;
  planDiscountPercent?: number;
  pixDiscountPercent?: number;
}

export function createProposalAcceptedEmail(data: ProposalAcceptedEmailData): string {
  const fidelTotal = data.fidelMonthlyValue * data.durationMonths;
  const selectedValue = data.selectedPlan === 'avista' ? data.cashTotalValue : fidelTotal;
  const selectedLabel = data.selectedPlan === 'avista' ? 'À Vista' : 'Fidelidade';
  
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Calculate discount breakdown
  const fullMonthly = data.fullMonthlyPrice || 0;
  const fullTotal = data.fullTotalPrice || (fullMonthly * data.durationMonths);
  const planDiscount = data.planDiscountPercent || 0;
  const pixDiscount = data.pixDiscountPercent || 0;
  
  // Calculate intermediate values for breakdown
  const afterPlanDiscount = fullTotal * (1 - planDiscount / 100);
  const planDiscountAmount = fullTotal - afterPlanDiscount;
  const pixDiscountAmount = afterPlanDiscount * (pixDiscount / 100);
  const finalValue = afterPlanDiscount - pixDiscountAmount;
  const totalSavings = fullTotal - finalValue;
  const totalSavingsPercent = fullTotal > 0 ? Math.round((totalSavings / fullTotal) * 100) : 0;

  // Plan name based on duration
  const planNames: Record<number, string> = {
    1: 'Mensal',
    3: 'Trimestral',
    6: 'Semestral',
    12: 'Anual'
  };
  const planName = planNames[data.durationMonths] || `${data.durationMonths} meses`;

  // Build discount breakdown section
  let discountBreakdownSection = '';
  if (fullTotal > 0 && (planDiscount > 0 || pixDiscount > 0)) {
    discountBreakdownSection = `
      <div style="background: #F8F9FA; border: 1px solid #E5E7EB; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <h3 style="color: #374151; margin: 0 0 16px 0; font-size: 15px; font-weight: 600; border-bottom: 1px solid #E5E7EB; padding-bottom: 12px;">
          📊 Detalhamento do seu investimento
        </h3>
        
        <table style="width: 100%; font-size: 14px; color: #4B5563;">
          <tr>
            <td style="padding: 6px 0;">Valor mensal (${data.buildingsCount} prédios × ${data.totalPanels} telas):</td>
            <td style="text-align: right; font-weight: 500;">${formatCurrency(fullMonthly)}/mês</td>
          </tr>
          <tr>
            <td style="padding: 6px 0;">Total sem desconto (${data.durationMonths} ${data.durationMonths === 1 ? 'mês' : 'meses'}):</td>
            <td style="text-align: right; text-decoration: line-through; color: #9CA3AF;">${formatCurrency(fullTotal)}</td>
          </tr>
        </table>
        
        <div style="border-top: 1px dashed #D1D5DB; margin: 12px 0; padding-top: 12px;">
          ${planDiscount > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px;">
              <span style="color: #059669;">✅ Desconto Plano ${planName} (${planDiscount}%)</span>
              <span style="color: #059669; font-weight: 500;">-${formatCurrency(planDiscountAmount)}</span>
            </div>
            ${pixDiscount > 0 ? `
              <div style="padding: 4px 0 6px 16px; font-size: 13px; color: #6B7280;">
                Subtotal: <span style="text-decoration: line-through;">${formatCurrency(afterPlanDiscount)}</span>
              </div>
            ` : ''}
          ` : ''}
          
          ${pixDiscount > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px;">
              <span style="color: #059669;">✅ Desconto PIX à Vista (${pixDiscount}%)</span>
              <span style="color: #059669; font-weight: 500;">-${formatCurrency(pixDiscountAmount)}</span>
            </div>
          ` : ''}
        </div>
        
        <div style="border-top: 2px solid #374151; margin-top: 12px; padding-top: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 16px; font-weight: 700; color: #111827;">💰 VALOR FINAL:</span>
            <span style="font-size: 20px; font-weight: 700; color: #8B1A1A;">${formatCurrency(selectedValue)}</span>
          </div>
          <div style="text-align: right; margin-top: 4px;">
            <span style="font-size: 13px; color: #059669; font-weight: 500;">
              Economia de ${formatCurrency(totalSavings)} (${totalSavingsPercent}% OFF!)
            </span>
          </div>
        </div>
      </div>
    `;
  }

  // Payment section - CORPORATE CLEAN STYLE (no colorful gradients)
  let paymentSection = '';
  
  if (data.paymentMethod === 'pix' && data.pixData) {
    paymentSection = `
      <div style="background: #F8F9FA; border: 1px solid #D1D5DB; border-radius: 12px; padding: 24px; margin: 20px 0; text-align: center;">
        <h3 style="color: #374151; margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">
          ⚡ Pagamento via PIX
        </h3>
        
        ${data.pixData.qrCodeBase64 ? `
          <div style="background: #ffffff; border: 1px solid #E5E7EB; border-radius: 12px; padding: 16px; display: inline-block; margin-bottom: 16px;">
            <img src="data:image/png;base64,${data.pixData.qrCodeBase64}" alt="QR Code PIX" style="width: 180px; height: 180px; display: block;" />
          </div>
        ` : ''}
        
        ${data.pixData.qrCode ? `
          <div style="background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 8px; padding: 12px; margin-top: 12px; text-align: left;">
            <p style="color: #6B7280; font-size: 12px; margin: 0 0 8px 0; font-weight: 600;">Código Pix Copia e Cola:</p>
            <p style="color: #374151; font-size: 10px; font-family: monospace; word-break: break-all; margin: 0; background: #F3F4F6; padding: 10px; border-radius: 6px; border: 1px solid #E5E7EB;">
              ${data.pixData.qrCode}
            </p>
          </div>
        ` : ''}
      </div>
      
      ${discountBreakdownSection}
    `;
  } else if (data.paymentMethod === 'boleto' && data.boletoData) {
    const formattedDueDate = data.boletoData.dueDate 
      ? new Date(data.boletoData.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')
      : 'Em até 3 dias úteis';
    
    paymentSection = `
      <div style="background: #F8F9FA; border: 1px solid #D1D5DB; border-radius: 12px; padding: 24px; margin: 20px 0; text-align: center;">
        <h3 style="color: #374151; margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">
          📄 Boleto Bancário
        </h3>
        
        <p style="color: #6B7280; font-size: 14px; margin: 0 0 16px 0;">
          Vencimento: <strong style="color: #374151;">${formattedDueDate}</strong>
        </p>
        
        ${data.boletoData.boletoUrl ? `
          <a href="${data.boletoData.boletoUrl}" target="_blank" style="display: inline-block; background: #8B1A1A; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin-bottom: 16px;">
            📥 Baixar Boleto
          </a>
        ` : ''}
        
        ${data.boletoData.boletoBarcode ? `
          <div style="background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 8px; padding: 12px; margin-top: 12px; text-align: left;">
            <p style="color: #6B7280; font-size: 12px; margin: 0 0 8px 0; font-weight: 600;">Código de Barras:</p>
            <p style="color: #374151; font-size: 11px; font-family: monospace; word-break: break-all; margin: 0; background: #F3F4F6; padding: 10px; border-radius: 6px; border: 1px solid #E5E7EB;">
              ${data.boletoData.boletoBarcode}
            </p>
          </div>
        ` : ''}
        
        <div style="background: #FEF3C7; border: 1px solid #FCD34D; border-radius: 8px; padding: 12px; margin-top: 16px; text-align: left;">
          <p style="color: #92400E; font-size: 13px; margin: 0;">
            <strong>📌 Importante:</strong> Os próximos boletos estarão disponíveis na sua área do cliente na plataforma EXA.
          </p>
        </div>
      </div>
      
      ${discountBreakdownSection}
    `;
  } else {
    // No payment method selected yet, just show discount breakdown
    paymentSection = discountBreakdownSection;
  }

  const content = `
    <p class="greeting">🎉 Parabéns, ${data.clientName}!</p>
    
    <p class="message">
      Sua proposta comercial foi <strong>aceita com sucesso</strong>! Estamos muito felizes 
      em tê-lo(a) como cliente da EXA Mídia.
    </p>

    <div style="background: #F0FDF4; border: 1px solid #86EFAC; border-radius: 12px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0; color: #166534; font-size: 14px;">
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

    <div style="background: #F8F9FA; border: 1px solid #E5E7EB; border-radius: 12px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.8;">
        <strong>Cliente:</strong> ${data.clientName}<br>
        ${data.clientCnpj ? `<strong>CNPJ:</strong> ${data.clientCnpj}<br>` : ''}
        <strong>Período:</strong> ${data.durationMonths} ${data.durationMonths === 1 ? 'mês' : 'meses'}<br>
        <strong>Prédios:</strong> ${data.buildingsCount} prédios (${data.totalPanels} telas)
      </p>
    </div>

    <div class="divider"></div>

    <p class="message" style="font-weight: 600; color: ${EXA_COLORS.text};">
      📅 Próximos passos:
    </p>

    <div style="background: #F8F9FA; border: 1px solid #E5E7EB; border-radius: 12px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.8;">
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
      <a href="https://wa.me/55${data.sellerPhone.replace(/\D/g, '')}" class="cta-button" style="background: #8B1A1A;">
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
