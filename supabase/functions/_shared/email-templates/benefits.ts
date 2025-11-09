// ============================================
// TEMPLATES DE BENEFÍCIOS (PRESTADORES)
// ============================================

import { createEmailTemplate, EXA_COLORS } from './base.ts';
import type { BenefitInvitationEmailData, BenefitGiftCodeEmailData } from './types.ts';

// Email: Convite para escolher presente
export function createBenefitInvitationEmail(data: BenefitInvitationEmailData): string {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <span style="font-size: 80px;">🎉</span>
    </div>
    
    <h1 class="greeting" style="text-align: center;">Parabéns, ${data.providerName}!</h1>
    
    <p class="message" style="text-align: center; font-size: 18px;">
      A cada painel instalado, a EXA celebra junto de quem esteve no campo!
    </p>
    
    ${data.activationPoint ? `
      <div style="background: ${EXA_COLORS.gradient}; padding: 24px 28px; border-radius: 12px; text-align: center; margin: 32px 0; box-shadow: 0 4px 16px rgba(125, 24, 24, 0.25);">
        <p style="color: #ffffff; font-weight: 700; font-size: 18px; margin: 0; letter-spacing: 0.5px;">
          📍 Ponto ativado: ${data.activationPoint}
        </p>
      </div>
    ` : ''}
    
    <p class="message" style="text-align: center; font-size: 17px;">
      Você é parte da <strong>revolução da atenção nos condomínios</strong>. Por isso, queremos te 
      agradecer com um presente especial de <strong style="color: ${EXA_COLORS.primary}; font-size: 24px;">R$ 50,00</strong>.
    </p>
    
    <div class="cta-container">
      <a href="${data.presentLink}" class="cta-button" style="font-size: 18px; padding: 20px 50px;">
        🎁 ESCOLHER MEU PRESENTE
      </a>
    </div>
    
    <!-- LINK ALTERNATIVO -->
    <div style="margin-top: 28px; padding: 20px; background-color: #f9fafb; border-radius: 12px; text-align: center; border: 2px solid #e5e7eb;">
      <p style="font-size: 13px; color: #6b7280; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
        Ou copie e cole este link no seu navegador:
      </p>
      <p style="font-size: 14px; color: ${EXA_COLORS.primary}; margin: 0; word-break: break-all; font-family: 'Courier New', monospace; font-weight: 600;">
        ${data.presentLink}
      </p>
    </div>
    
    <div class="warning-box">
      <p><strong>⚠️ Importante:</strong> Este link é único e pessoal. Após escolher seu presente, 
      ele não poderá ser usado novamente.</p>
    </div>
  `;

  return createEmailTemplate({
    title: 'Você Ganhou um Presente!',
    subtitle: 'Parabéns pela Ativação',
    content,
    footerText: 'Publicidade que vive nos elevadores 🚀'
  });
}

// Email: Código do presente escolhido
export function createBenefitGiftCodeEmail(data: BenefitGiftCodeEmailData): string {
  const benefitNames: Record<string, string> = {
    shopee: "Shopee 🛍️",
    renner: "Renner 👗",
    riachuelo: "Riachuelo 👔",
    havaianas: "Havaianas 🩴",
    arezzo: "Arezzo 👠",
    petz: "Petz 🐾",
    cacau_show: "Cacau Show 🍫",
    mcdonalds: "McDonald's 🍟",
    madero: "Madero 🍔",
    jeronimo: "Jeronimo 🍕",
    ze_delivery: "Zé Delivery 🍺",
    uber: "Uber 🚗",
    spotify: "Spotify 🎧",
    netflix: "Netflix 🎬",
  };

  const benefitName = benefitNames[data.benefitChoice] || data.benefitChoice;
  const isLink = data.deliveryType === 'link';
  
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <span style="font-size: 80px;">🎁</span>
    </div>
    
    <h1 class="greeting" style="text-align: center; color: ${EXA_COLORS.primary};">
      Aqui Está Seu Presente!
    </h1>
    
    <p class="message" style="text-align: center;">
      Olá, <strong>${data.providerName}</strong>!
    </p>
    
    <p class="message" style="text-align: center;">
      Obrigado por ser parte da nossa rede. Seu presente está pronto para uso!
    </p>
    
    <!-- ESCOLHA -->
    <div style="background: ${EXA_COLORS.gradient}; padding: 30px; border-radius: 12px; margin: 30px 0; text-align: center;">
      <p style="color: #ffffff; font-size: 18px; margin: 0 0 10px 0;">Você escolheu:</p>
      <h2 style="color: #ffffff; font-size: 32px; margin: 0;">${benefitName}</h2>
    </div>
    
    <!-- CÓDIGO/LINK -->
    <div style="background-color: #f8f9fa; border: 3px dashed ${EXA_COLORS.primary}; padding: 30px; border-radius: 12px; margin: 30px 0; text-align: center;">
      <p style="margin: 0 0 15px 0; font-weight: 600; color: ${EXA_COLORS.primary}; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
        ${isLink ? '🔗 SEU LINK' : '🎟️ SEU CÓDIGO'}
      </p>
      ${isLink ? `
        <a href="${data.giftCode}" style="margin: 0; font-size: 18px; color: ${EXA_COLORS.primary}; font-weight: 700; word-break: break-all; text-decoration: underline;">
          ${data.giftCode}
        </a>
      ` : `
        <h2 style="margin: 0; font-size: 36px; color: #1a1a1a; font-weight: 900; letter-spacing: 4px; font-family: 'Courier New', monospace;">
          ${data.giftCode}
        </h2>
      `}
    </div>
    
    ${data.redemptionInstructions ? `
      <div class="info-box">
        <p><strong>📖 Como usar:</strong></p>
        <p style="margin-top: 12px; white-space: pre-wrap;">${data.redemptionInstructions}</p>
      </div>
    ` : ''}
    
    <div class="success-box">
      <p><strong>✅ Código Ativado e Pronto para Uso!</strong></p>
      <p style="margin-top: 8px;">
        ${isLink ? 'Clique no link acima para acessar seu benefício.' : 'Use o código acima no checkout ou apresente na loja.'}
      </p>
    </div>
    
    <div class="warning-box">
      <p><strong>⚠️ Atenção:</strong> Guarde este email! Este código é único e não pode ser recuperado. 
      Após o uso, ele não poderá ser reutilizado.</p>
    </div>
    
    <div class="divider"></div>
    
    <p class="message" style="text-align: center; font-size: 16px; color: #4a4a4a;">
      <strong>Obrigado por fazer parte da revolução da EXA!</strong><br>
      Continue indicando pontos e ganhe mais presentes. 🚀
    </p>
  `;

  return createEmailTemplate({
    title: 'Seu Presente da EXA',
    subtitle: benefitName,
    content,
    footerText: 'Este código é pessoal e intransferível.'
  });
}
