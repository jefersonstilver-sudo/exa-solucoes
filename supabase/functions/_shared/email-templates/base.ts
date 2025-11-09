// ============================================
// COMPONENTES BASE E ESTILOS - EMAIL TEMPLATES
// ============================================

// Logo oficial da EXA
export const EXA_LOGO_URL = 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/arquivos/logo%20e%20icones/Publicidade%20Inteligente%20(800%20x%20800%20px).png';

// Cores oficiais da EXA
export const EXA_COLORS = {
  primary: '#7D1818',
  primaryDark: '#9C1E1E',
  primaryLight: '#DC2626',
  gradient: 'linear-gradient(135deg, #7D1818 0%, #9C1E1E 100%)',
  gradientAlt: 'linear-gradient(135deg, #9C1E1E 0%, #7D1818 100%)',
};

// Estilos base compartilhados
export const BASE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
  
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    margin: 0;
    padding: 0;
    background-color: #f5f5f5;
    color: #333333;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  .email-wrapper {
    width: 100%;
    background-color: #f5f5f5;
    padding: 40px 20px;
  }
  
  .email-container {
    max-width: 600px;
    margin: 0 auto;
    background: #ffffff;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  }
  
  /* HEADER */
  .header {
    background: ${EXA_COLORS.gradient};
    padding: 50px 40px;
    text-align: center;
  }
  
  .header-logo {
    max-width: 220px;
    height: auto;
    display: block;
    margin: 0 auto 20px auto;
  }
  
  .header-title {
    font-size: 32px;
    font-weight: 800;
    color: #ffffff;
    margin: 0 0 10px 0;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  }
  
  .header-subtitle {
    font-size: 16px;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.95);
    margin: 0;
    letter-spacing: 0.5px;
  }
  
  /* CONTENT */
  .content {
    padding: 48px 40px;
    background: #ffffff;
  }
  
  .greeting {
    font-size: 24px;
    font-weight: 700;
    color: #1a1a1a;
    margin: 0 0 20px;
    line-height: 1.3;
  }
  
  .message {
    font-size: 16px;
    line-height: 1.7;
    color: #4a4a4a;
    margin: 0 0 24px;
  }
  
  .message strong {
    color: ${EXA_COLORS.primary};
    font-weight: 600;
  }
  
  /* BUTTONS */
  .cta-button {
    display: inline-block;
    background: ${EXA_COLORS.gradient};
    color: #ffffff !important;
    font-weight: 700;
    text-decoration: none !important;
    padding: 18px 48px;
    border-radius: 50px;
    font-size: 16px;
    text-align: center;
    letter-spacing: 0.5px;
    box-shadow: 0 6px 20px rgba(125, 24, 24, 0.35);
    transition: all 0.3s ease;
  }
  
  .cta-container {
    text-align: center;
    margin: 32px 0;
  }
  
  /* INFO BOXES */
  .info-box {
    background: #fafafa;
    border-left: 4px solid ${EXA_COLORS.primary};
    padding: 20px 24px;
    margin: 28px 0;
    border-radius: 8px;
  }
  
  .info-box p {
    font-size: 14px;
    line-height: 1.6;
    color: #666666;
    margin: 0;
  }
  
  .info-box strong {
    color: ${EXA_COLORS.primary};
    font-weight: 600;
  }
  
  .warning-box {
    background: linear-gradient(135deg, #fef3f2 0%, #fee2e2 100%);
    border-left: 4px solid ${EXA_COLORS.primary};
    padding: 20px 24px;
    margin: 28px 0;
    border-radius: 8px;
  }
  
  .warning-box p {
    font-size: 14px;
    line-height: 1.6;
    color: ${EXA_COLORS.primary};
    margin: 0;
  }
  
  .warning-box strong {
    color: ${EXA_COLORS.primaryDark};
    font-weight: 700;
  }
  
  .success-box {
    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
    border-left: 4px solid #10b981;
    padding: 20px 24px;
    margin: 28px 0;
    border-radius: 8px;
  }
  
  .success-box p {
    font-size: 14px;
    line-height: 1.6;
    color: #065f46;
    margin: 0;
  }
  
  /* DIVIDER */
  .divider {
    height: 1px;
    background: linear-gradient(to right, transparent, #e0e0e0, transparent);
    margin: 32px 0;
  }
  
  /* FOOTER */
  .footer {
    background: #fafafa;
    padding: 32px 40px;
    text-align: center;
    border-top: 1px solid #f0f0f0;
  }
  
  .footer-brand {
    font-size: 16px;
    font-weight: 700;
    color: ${EXA_COLORS.primary};
    margin: 0 0 12px;
  }
  
  .footer-text {
    font-size: 13px;
    line-height: 1.6;
    color: #999999;
    margin: 8px 0;
  }
  
  .footer-link {
    color: ${EXA_COLORS.primary};
    text-decoration: none;
    font-weight: 600;
  }
  
  /* RESPONSIVE */
  @media screen and (max-width: 640px) {
    .email-wrapper {
      padding: 20px 10px;
    }
    
    .header {
      padding: 40px 24px;
    }
    
    .header-logo {
      max-width: 180px;
    }
    
    .header-title {
      font-size: 26px;
    }
    
    .content {
      padding: 32px 24px;
    }
    
    .footer {
      padding: 24px;
    }
    
    .greeting {
      font-size: 20px;
    }
    
    .message {
      font-size: 15px;
    }
    
    .cta-button {
      padding: 16px 36px;
      font-size: 15px;
      display: block;
      width: 100%;
    }
  }
`;

// Componente de Header
export function createHeader(title: string, subtitle?: string): string {
  return `
    <div class="header">
      <img src="${EXA_LOGO_URL}" alt="EXA Mídia" class="header-logo" />
      ${title ? `<h1 class="header-title">${title}</h1>` : ''}
      ${subtitle ? `<p class="header-subtitle">${subtitle}</p>` : ''}
    </div>
  `;
}

// Componente de Footer
export function createFooter(customText?: string): string {
  const currentYear = new Date().getFullYear();
  
  return `
    <div class="footer">
      <p class="footer-brand">EXA • Publicidade Inteligente</p>
      <p class="footer-text">
        Precisa de ajuda? Entre em contato: 
        <a href="mailto:suporte@examidia.com.br" class="footer-link">suporte@examidia.com.br</a>
      </p>
      <p class="footer-text" style="margin-top: 16px;">
        © ${currentYear} EXA Mídia. Todos os direitos reservados.
      </p>
      ${customText ? `<p class="footer-text" style="font-size: 12px; color: #bbbbbb; margin-top: 12px;">${customText}</p>` : ''}
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
