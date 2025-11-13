// ============================================
// TEMPLATES INLINE - SEM DEPENDÊNCIAS EXTERNAS
// ============================================
// Todos os HTMLs inline para garantir deploy correto

const EXA_LOGO_URL = 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/arquivos/logo%20e%20icones/Publicidade%20Inteligente%20(800%20x%20800%20px).png';

export function createResendConfirmationEmailInline(userName: string, confirmationUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <title>🔄 Confirme seu E-mail</title>
  <style>
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
    
    .header {
      background: linear-gradient(135deg, #7D1818 0%, #9C1E1E 100%);
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
      color: #7D1818;
      font-weight: 600;
    }
    
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #7D1818 0%, #9C1E1E 100%);
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
    
    .info-box {
      background: #fafafa;
      border-left: 4px solid #7D1818;
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
      color: #7D1818;
      font-weight: 600;
    }
    
    .warning-box {
      background: linear-gradient(135deg, #fef3f2 0%, #fee2e2 100%);
      border-left: 4px solid #7D1818;
      padding: 20px 24px;
      margin: 28px 0;
      border-radius: 8px;
    }
    
    .warning-box p {
      font-size: 14px;
      line-height: 1.6;
      color: #7D1818;
      margin: 0;
    }
    
    .warning-box strong {
      color: #9C1E1E;
      font-weight: 700;
    }
    
    .divider {
      height: 1px;
      background: linear-gradient(to right, transparent, #e0e0e0, transparent);
      margin: 32px 0;
    }
    
    .footer {
      background: #fafafa;
      padding: 32px 40px;
      text-align: center;
      border-top: 1px solid #f0f0f0;
    }
    
    .footer-brand {
      font-size: 16px;
      font-weight: 700;
      color: #7D1818;
      margin: 0 0 12px;
    }
    
    .footer-text {
      font-size: 13px;
      line-height: 1.6;
      color: #999999;
      margin: 8px 0;
    }
    
    .footer-link {
      color: #7D1818;
      text-decoration: none;
      font-weight: 600;
    }
    
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
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <div class="header">
        <img src="${EXA_LOGO_URL}" alt="EXA Mídia" class="header-logo" />
        <h1 class="header-title">🔄 Confirme seu E-mail</h1>
        <p class="header-subtitle">Link Reenviado</p>
      </div>
      <div class="content">
        <h1 class="greeting">Olá, ${userName}!</h1>
        
        <p class="message">
          Você solicitou o reenvio do link de confirmação de e-mail. Clique no botão abaixo para 
          ativar sua conta e começar a usar a plataforma EXA:
        </p>
        
        <div class="cta-container">
          <a href="${confirmationUrl}" class="cta-button">✓ Confirmar E-mail</a>
        </div>
        
        <div style="background-color: #fafafa; border: 1px solid #e0e0e0; padding: 16px 20px; margin: 24px 0; border-radius: 8px;">
          <p style="font-size: 13px; color: #666666; margin: 0 0 8px 0; font-weight: 500;">
            Ou copie e cole este link no seu navegador:
          </p>
          <div style="background-color: #ffffff; border: 1px solid #d0d0d0; padding: 12px; border-radius: 4px; word-break: break-all; font-family: monospace; font-size: 12px; color: #333333; line-height: 1.5;">
            ${confirmationUrl}
          </div>
        </div>
        
        <div class="warning-box">
          <p><strong>⏰ Atenção:</strong> Este link de confirmação expira em 24 horas. Certifique-se de 
          confirmar seu e-mail antes que ele expire para garantir o acesso total à plataforma.</p>
        </div>
        
        <div class="info-box">
          <p><strong>Problemas para confirmar?</strong></p>
          <p style="margin-top: 8px;">
            • Certifique-se de usar o link mais recente enviado<br>
            • Tente abrir em um navegador diferente<br>
            • Verifique se o link não foi quebrado em várias linhas<br>
            • Entre em contato com nosso suporte se o problema persistir
          </p>
        </div>
      </div>
      <div class="footer">
        <p class="footer-brand">EXA • Publicidade Inteligente</p>
        <p class="footer-text">
          Precisa de ajuda? Entre em contato: 
          <a href="mailto:suporte@examidia.com.br" class="footer-link">suporte@examidia.com.br</a>
        </p>
        <p class="footer-text" style="margin-top: 16px;">
          © ${new Date().getFullYear()} EXA Mídia. Todos os direitos reservados.
        </p>
        <p class="footer-text" style="font-size: 12px; color: #bbbbbb; margin-top: 12px;">Se você não solicitou este e-mail, pode ignorá-lo com segurança.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}
