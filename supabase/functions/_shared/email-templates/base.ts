// ============================================
// COMPONENTES BASE E ESTILOS - EMAIL TEMPLATES
// ============================================
// 🔄 FORÇAR REDEPLOY: 2025-11-13T00:42:00Z
// ✅ Versão moderna com gradientes e estilos profissionais

// Logo oficial da EXA - Signed URL com validade de 10 anos
// Esta URL é gerada com createSignedUrl e funciona mesmo com bucket privado
export const EXA_LOGO_URL = 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/Publicidade%20Inteligente%20(800%20x%20800%20px).png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL1B1YmxpY2lkYWRlIEludGVsaWdlbnRlICg4MDAgeCAwMCBweCkucG5nIiwiaWF0IjoxNzMxNTk2NDY1LCJleHAiOjIwNDY5NTY0NjV9.VFyY9LhRPwt6Y8f_J3mQoO7xK7qHjHRtD0PxGYcvLrE';

// Cores oficiais da EXA - Brand Identity
export const EXA_COLORS = {
  primary: '#8B1A1A',
  primaryDark: '#6B1414',
  primaryLight: '#A52020',
  accent: '#F5F5F5',
  text: '#333333',
  textLight: '#666666',
  gradient: 'linear-gradient(135deg, #8B1A1A 0%, #A52020 100%)',
  gradientAlt: 'linear-gradient(135deg, #A52020 0%, #8B1A1A 100%)',
  gradientSubtle: 'linear-gradient(180deg, #FFFFFF 0%, #F9F9F9 100%)',
};

// Estilos base compartilhados - Design profissional e elegante
export const BASE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
  
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    margin: 0;
    padding: 0;
    background: ${EXA_COLORS.gradientSubtle};
    color: ${EXA_COLORS.text};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    line-height: 1.6;
  }
  
  .email-wrapper {
    width: 100%;
    background: ${EXA_COLORS.gradientSubtle};
    padding: 48px 20px;
  }
  
  .email-container {
    max-width: 600px;
    margin: 0 auto;
    background: #ffffff;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(139, 26, 26, 0.12);
  }
  
  /* HEADER - Elegante e profissional */
  .header {
    background: ${EXA_COLORS.gradient};
    padding: 56px 48px;
    text-align: center;
    position: relative;
  }
  
  .header::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  }
  
  .header-logo {
    max-width: 200px;
    height: auto;
    display: block;
    margin: 0 auto 24px auto;
    filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15));
  }
  
  .header-title {
    font-size: 28px;
    font-weight: 800;
    color: #ffffff;
    margin: 0 0 12px 0;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    letter-spacing: -0.5px;
  }
  
  .header-subtitle {
    font-size: 15px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.95);
    margin: 0;
    letter-spacing: 0.3px;
  }
  
  /* CONTENT - Typography elegante */
  .content {
    padding: 48px 48px;
    background: #ffffff;
  }
  
  .greeting {
    font-size: 26px;
    font-weight: 800;
    color: ${EXA_COLORS.text};
    margin: 0 0 24px;
    line-height: 1.3;
    letter-spacing: -0.3px;
  }
  
  .message {
    font-size: 16px;
    line-height: 1.75;
    color: ${EXA_COLORS.textLight};
    margin: 0 0 20px;
  }
  
  .message strong {
    color: ${EXA_COLORS.primary};
    font-weight: 700;
  }
  
  /* BUTTONS - CTA destacável e profissional */
  .cta-button {
    display: inline-block;
    background: ${EXA_COLORS.gradient};
    color: #ffffff !important;
    font-weight: 700;
    text-decoration: none !important;
    padding: 16px 42px;
    border-radius: 12px;
    font-size: 16px;
    text-align: center;
    letter-spacing: 0.3px;
    box-shadow: 0 4px 16px rgba(139, 26, 26, 0.3);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 2px solid transparent;
  }
  
  .cta-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(139, 26, 26, 0.4);
  }
  
  .cta-container {
    text-align: center;
    margin: 36px 0;
  }
  
  /* INFO BOXES - Elegantes e destacáveis */
  .info-box {
    background: linear-gradient(135deg, #F9F9F9 0%, #F5F5F5 100%);
    border-left: 4px solid ${EXA_COLORS.primary};
    padding: 24px 28px;
    margin: 28px 0;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }
  
  .info-box p {
    font-size: 14px;
    line-height: 1.7;
    color: ${EXA_COLORS.textLight};
    margin: 0;
  }
  
  .info-box strong {
    color: ${EXA_COLORS.primary};
    font-weight: 700;
  }
  
  .warning-box {
    background: linear-gradient(135deg, #FEF3F2 0%, #FEE2E2 100%);
    border-left: 4px solid ${EXA_COLORS.primary};
    padding: 24px 28px;
    margin: 28px 0;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(139, 26, 26, 0.08);
  }
  
  .warning-box p {
    font-size: 14px;
    line-height: 1.7;
    color: #7C2D12;
    margin: 0;
  }
  
  .warning-box strong {
    color: ${EXA_COLORS.primary};
    font-weight: 700;
  }
  
  .success-box {
    background: linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%);
    border-left: 4px solid #22C55E;
    padding: 24px 28px;
    margin: 28px 0;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(34, 197, 94, 0.08);
  }
  
  .success-box p {
    font-size: 14px;
    line-height: 1.7;
    color: #166534;
    margin: 0;
  }
  
  .success-box strong {
    color: #15803D;
    font-weight: 700;
  }
  
  /* DIVIDER - Suave e elegante */
  .divider {
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(139, 26, 26, 0.1), transparent);
    margin: 36px 0;
  }
  
  /* FOOTER - Profissional e limpo */
  .footer {
    background: linear-gradient(180deg, #FAFAFA 0%, #F5F5F5 100%);
    padding: 40px 48px 48px;
    text-align: center;
    border-top: 1px solid #E5E5E5;
  }
  
  .footer-brand {
    font-size: 18px;
    font-weight: 900;
    color: ${EXA_COLORS.primary};
    margin: 0 0 8px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  
  .footer-tagline {
    font-size: 13px;
    color: ${EXA_COLORS.textLight};
    margin: 0 0 24px;
    font-weight: 500;
    letter-spacing: 0.3px;
  }
  
  .footer-text {
    font-size: 13px;
    line-height: 1.7;
    color: #999999;
    margin: 0 0 8px;
  }
  
  .footer-link {
    color: ${EXA_COLORS.primary};
    text-decoration: none;
    font-weight: 600;
    transition: color 0.2s ease;
  }
  
  .footer-link:hover {
    color: ${EXA_COLORS.primaryLight};
    text-decoration: underline;
  }
  
  /* RESPONSIVE - Mobile otimizado */
  @media screen and (max-width: 640px) {
    .email-wrapper {
      padding: 24px 12px;
    }
    
    .email-container {
      border-radius: 12px;
    }
    
    .header {
      padding: 40px 28px;
    }
    
    .header-logo {
      max-width: 160px;
      margin-bottom: 20px;
    }
    
    .header-title {
      font-size: 24px;
      margin-bottom: 8px;
    }
    
    .header-subtitle {
      font-size: 14px;
    }
    
    .content {
      padding: 36px 28px;
    }
    
    .greeting {
      font-size: 22px;
      margin-bottom: 20px;
    }
    
    .message {
      font-size: 15px;
      line-height: 1.7;
    }
    
    .cta-button {
      width: 100%;
      padding: 16px 32px;
      font-size: 15px;
    }
    
    .info-box,
    .warning-box,
    .success-box {
      padding: 20px 24px;
      margin: 24px 0;
    }
    
    .footer {
      padding: 36px 28px 40px;
    }
    
    .footer-brand {
      font-size: 16px;
    }
  }
  
  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .email-container {
      background: #ffffff !important;
    }
  }
`;

// Componente de Header - Elegante e profissional
export function createHeader(title: string, subtitle?: string): string {
  return `
    <div class="header">
      <img src="${EXA_LOGO_URL}" alt="EXA Mídia" class="header-logo" />
      ${title ? `<h1 class="header-title">${title}</h1>` : ''}
      ${subtitle ? `<p class="header-subtitle">${subtitle}</p>` : ''}
    </div>
  `;
}

// Componente de Footer - Profissional e elegante
export function createFooter(customText?: string): string {
  return `
    <div class="footer">
      <p class="footer-brand">EXA</p>
      <p class="footer-tagline">Publicidade Inteligente em Painéis Digitais</p>
      <p class="footer-text">
        Precisa de ajuda? Entre em contato:<br>
        <a href="mailto:suporte@examidia.com.br" class="footer-link">suporte@examidia.com.br</a>
      </p>
      <div class="divider" style="margin: 24px auto; max-width: 200px;"></div>
      <p class="footer-text" style="margin-top: 16px; font-size: 12px;">
        © ${new Date().getFullYear()} EXA Mídia - Todos os direitos reservados
      </p>
      ${customText ? `
        <p class="footer-text" style="font-size: 12px; color: #AAAAAA; margin-top: 16px; font-style: italic;">
          ${customText}
        </p>
      ` : ''}
    </div>
  `;
}

// Template base completo
export function createEmailTemplate(params: {
  title?: string;
  subtitle?: string;
  content: string;
  footerText?: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <title>${params.title || 'EXA Mídia'}</title>
  <style>
    ${BASE_STYLES}
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      ${createHeader(params.title || '', params.subtitle)}
      <div class="content">
        ${params.content}
      </div>
      ${createFooter(params.footerText)}
    </div>
  </div>
</body>
</html>
  `;
}
