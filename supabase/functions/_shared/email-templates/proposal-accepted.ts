// ============================================
// TEMPLATE EMAIL - PROPOSTA ACEITA
// Estilo corporativo SÓBRIO - branco/cinza com mínimo de cores
// ============================================

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
  // Discount breakdown data
  fullMonthlyPrice?: number;
  fullTotalPrice?: number;
  planDiscountPercent?: number;
  pixDiscountPercent?: number;
}

// Logo oficial EXA
const EXA_LOGO_URL = 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/email-assets/exa-logo.png';

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
  
  // Calculate intermediate values
  const afterPlanDiscount = fullTotal * (1 - planDiscount / 100);
  const planDiscountAmount = fullTotal - afterPlanDiscount;
  const pixDiscountAmount = afterPlanDiscount * (pixDiscount / 100);
  const finalValue = afterPlanDiscount - pixDiscountAmount;
  const totalSavings = fullTotal - finalValue;
  const totalSavingsPercent = fullTotal > 0 ? Math.round((totalSavings / fullTotal) * 100) : 0;

  // Plan name
  const planNames: Record<number, string> = { 1: 'Mensal', 3: 'Trimestral', 6: 'Semestral', 12: 'Anual' };
  const planName = planNames[data.durationMonths] || `${data.durationMonths} meses`;

  // Discount breakdown section
  let discountBreakdownHtml = '';
  if (fullTotal > 0 && (planDiscount > 0 || pixDiscount > 0)) {
    discountBreakdownHtml = `
      <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <p style="color: #374151; margin: 0 0 16px 0; font-size: 14px; font-weight: 600; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px;">
          Detalhamento do investimento
        </p>
        
        <table style="width: 100%; font-size: 13px; color: #4B5563; border-collapse: collapse;">
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
            <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #059669;">Desconto Plano ${planName} (${planDiscount}%)</td>
                <td style="text-align: right; color: #059669; font-weight: 500;">-${formatCurrency(planDiscountAmount)}</td>
              </tr>
            </table>
          ` : ''}
          
          ${pixDiscount > 0 ? `
            <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #059669;">Desconto PIX à Vista (${pixDiscount}%)</td>
                <td style="text-align: right; color: #059669; font-weight: 500;">-${formatCurrency(pixDiscountAmount)}</td>
              </tr>
            </table>
          ` : ''}
        </div>
        
        <div style="border-top: 2px solid #374151; margin-top: 12px; padding-top: 12px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="font-size: 15px; font-weight: 700; color: #111827;">VALOR FINAL:</td>
              <td style="text-align: right; font-size: 18px; font-weight: 700; color: #8B1A1A;">${formatCurrency(selectedValue)}</td>
            </tr>
          </table>
          <p style="text-align: right; margin: 4px 0 0 0; font-size: 12px; color: #059669; font-weight: 500;">
            Economia de ${formatCurrency(totalSavings)} (${totalSavingsPercent}% OFF)
          </p>
        </div>
      </div>
    `;
  }

  // Payment section - PIX with QR Code
  let paymentSectionHtml = '';
  
  if (data.paymentMethod === 'pix' && data.pixData) {
    paymentSectionHtml = `
      <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center;">
        <p style="color: #374151; margin: 0 0 16px 0; font-size: 15px; font-weight: 600;">
          Pagamento via PIX
        </p>
        
        ${data.pixData.qrCodeBase64 ? `
          <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; display: inline-block; margin-bottom: 16px;">
            <img src="data:image/png;base64,${data.pixData.qrCodeBase64}" alt="QR Code PIX" style="width: 180px; height: 180px; display: block;" />
          </div>
          <p style="color: #6B7280; font-size: 12px; margin: 0 0 16px 0;">
            Escaneie o QR Code acima com o app do seu banco
          </p>
        ` : ''}
        
        ${data.pixData.qrCode ? `
          <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; margin-top: 12px; text-align: left;">
            <p style="color: #6B7280; font-size: 11px; margin: 0 0 8px 0; font-weight: 600; text-transform: uppercase;">Código Pix Copia e Cola:</p>
            <p style="color: #374151; font-size: 10px; font-family: monospace; word-break: break-all; margin: 0; background-color: #f3f4f6; padding: 10px; border-radius: 4px; border: 1px solid #e5e7eb;">
              ${data.pixData.qrCode}
            </p>
          </div>
        ` : ''}
      </div>
    `;
  } else if (data.paymentMethod === 'boleto' && data.boletoData) {
    const formattedDueDate = data.boletoData.dueDate 
      ? new Date(data.boletoData.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')
      : 'Em até 3 dias úteis';
    
    paymentSectionHtml = `
      <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center;">
        <p style="color: #374151; margin: 0 0 16px 0; font-size: 15px; font-weight: 600;">
          Boleto Bancário
        </p>
        
        <p style="color: #6B7280; font-size: 14px; margin: 0 0 16px 0;">
          Vencimento: <strong style="color: #374151;">${formattedDueDate}</strong>
        </p>
        
        ${data.boletoData.boletoUrl ? `
          <a href="${data.boletoData.boletoUrl}" target="_blank" style="display: inline-block; background-color: #8B1A1A; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; margin-bottom: 16px;">
            Baixar Boleto
          </a>
        ` : ''}
        
        ${data.boletoData.boletoBarcode ? `
          <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; margin-top: 12px; text-align: left;">
            <p style="color: #6B7280; font-size: 11px; margin: 0 0 8px 0; font-weight: 600; text-transform: uppercase;">Código de Barras:</p>
            <p style="color: #374151; font-size: 10px; font-family: monospace; word-break: break-all; margin: 0; background-color: #f3f4f6; padding: 10px; border-radius: 4px; border: 1px solid #e5e7eb;">
              ${data.boletoData.boletoBarcode}
            </p>
          </div>
        ` : ''}
      </div>
    `;
  }

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light only">
  <title>Proposta Aceita - EXA Mídia</title>
  <style>
    :root { color-scheme: light only; }
    @media (prefers-color-scheme: dark) {
      body, .email-wrapper, .email-container { background-color: #ffffff !important; color: #333333 !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f5; -webkit-font-smoothing: antialiased;">
  
  <div class="email-wrapper" style="width: 100%; background-color: #f5f5f5; padding: 40px 20px;">
    <div class="email-container" style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);">
      
      <!-- Header - CLEAN WHITE -->
      <div style="background-color: #ffffff; padding: 32px; text-align: center; border-bottom: 1px solid #f0f0f0;">
        <img src="${EXA_LOGO_URL}" alt="EXA Mídia" style="height: 48px; width: auto; display: block; margin: 0 auto;" />
      </div>
      
      <!-- Content -->
      <div style="padding: 40px 32px; background-color: #ffffff;">
        
        <h1 style="color: #111827; font-size: 22px; font-weight: 600; text-align: center; margin: 0 0 8px;">
          Proposta Aceita!
        </h1>
        
        <p style="color: #6B7280; font-size: 14px; text-align: center; margin: 0 0 24px;">
          Proposta ${data.proposalNumber}
        </p>
        
        <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
          Olá, <strong>${data.clientName}</strong>!<br><br>
          Sua proposta comercial foi <strong>aceita com sucesso</strong>. Estamos muito felizes em tê-lo(a) como cliente da EXA Mídia.
        </p>

        <!-- Confirmation box -->
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; color: #166534; font-size: 14px;">
            <strong>Proposta ${data.proposalNumber} aceita!</strong><br>
            Opção escolhida: <strong>${selectedLabel}</strong><br>
            Valor: <strong>${formatCurrency(selectedValue)}</strong>
          </p>
        </div>

        ${paymentSectionHtml}
        
        ${discountBreakdownHtml}

        <!-- Summary -->
        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <p style="color: #374151; margin: 0 0 12px 0; font-size: 14px; font-weight: 600;">Resumo:</p>
          <p style="margin: 0; color: #4B5563; font-size: 13px; line-height: 1.8;">
            <strong>Cliente:</strong> ${data.clientName}<br>
            ${data.clientCnpj ? `<strong>CNPJ:</strong> ${data.clientCnpj}<br>` : ''}
            <strong>Período:</strong> ${data.durationMonths} ${data.durationMonths === 1 ? 'mês' : 'meses'}<br>
            <strong>Prédios:</strong> ${data.buildingsCount} prédios (${data.totalPanels} telas)
          </p>
        </div>

        <!-- Next steps -->
        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <p style="color: #374151; margin: 0 0 12px 0; font-size: 14px; font-weight: 600;">Próximos passos:</p>
          <p style="margin: 0; color: #4B5563; font-size: 13px; line-height: 1.8;">
            1. ${data.paymentMethod ? 'Efetue o pagamento usando os dados acima.' : 'Aguarde o contrato por e-mail.'}<br>
            2. Após confirmação, você receberá suas credenciais de acesso.<br>
            3. Envie seus vídeos e acompanhe suas campanhas na plataforma.
          </p>
        </div>

        <!-- CTA -->
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://wa.me/55${data.sellerPhone.replace(/\D/g, '')}" style="display: inline-block; background-color: #8B1A1A; color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
            Falar com ${data.sellerName.split(' ')[0]}
          </a>
        </div>

        <p style="color: #9CA3AF; font-size: 13px; text-align: center; margin: 24px 0 0 0;">
          Obrigado por escolher a EXA Mídia!
        </p>
        
      </div>
      
      <!-- Footer -->
      <div style="background-color: #fafafa; padding: 24px 32px; text-align: center; border-top: 1px solid #f0f0f0;">
        <p style="color: #8B1A1A; font-size: 13px; font-weight: 600; margin: 0 0 4px;">EXA Mídia</p>
        <p style="color: #9CA3AF; font-size: 12px; margin: 0 0 16px;">Publicidade Inteligente em Painéis Digitais</p>
        <p style="color: #D1D5DB; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} EXA Mídia - Todos os direitos reservados</p>
      </div>
      
    </div>
  </div>
  
</body>
</html>
  `;
}
