
export class EmailTemplates {
  static createConfirmationHTML(userName: string, confirmationUrl: string): string {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo à EXA</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      -webkit-font-smoothing: antialiased;
    }
    
    .container {
      max-width: 600px;
      margin: 40px auto;
      padding: 20px;
    }
    
    .email-container {
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px;
      text-align: center;
    }
    
    .logo {
      font-size: 48px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: 4px;
      margin: 0;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    }
    
    .content {
      padding: 40px;
      text-align: center;
      background: #ffffff;
    }
    
    h1 {
      font-size: 28px;
      font-weight: 700;
      color: #1a202c;
      margin: 0 0 20px;
    }
    
    p {
      font-size: 16px;
      line-height: 1.6;
      color: #4a5568;
      margin: 0 0 24px;
    }
    
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      font-weight: 600;
      text-decoration: none;
      padding: 16px 40px;
      border-radius: 50px;
      font-size: 16px;
      margin: 20px 0;
      text-align: center;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }
    
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
    }
    
    .benefits {
      background: #f7fafc;
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
      text-align: left;
    }
    
    .benefit-item {
      display: flex;
      align-items: start;
      margin-bottom: 16px;
    }
    
    .benefit-icon {
      font-size: 24px;
      margin-right: 12px;
    }
    
    .benefit-text {
      flex: 1;
      color: #4a5568;
      font-size: 14px;
      line-height: 1.5;
      margin: 0;
    }
    
    .footer {
      padding: 32px 40px;
      text-align: center;
      background: #f7fafc;
      border-top: 1px solid #e2e8f0;
    }
    
    .footer p {
      font-size: 13px;
      color: #718096;
      margin: 8px 0;
    }
    
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
    
    @media screen and (max-width: 480px) {
      .container {
        padding: 10px;
        margin: 20px auto;
      }
      
      .header, .content, .footer {
        padding: 24px 20px;
      }
      
      h1 {
        font-size: 24px;
      }
      
      .logo {
        font-size: 36px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="email-container">
      <div class="header">
        <h1 class="logo">EXA</h1>
      </div>
      
      <div class="content">
        <h1>🎉 Bem-vindo à EXA, ${userName}!</h1>
        <p>Estamos muito felizes em tê-lo conosco! Para começar a aproveitar todos os benefícios da nossa plataforma de painéis digitais, confirme seu e-mail clicando no botão abaixo:</p>
        
        <a href="${confirmationUrl}" class="button">✨ Ativar minha conta</a>
        
        <div class="benefits">
          <div class="benefit-item">
            <span class="benefit-icon">📊</span>
            <p class="benefit-text"><strong>Gestão Completa</strong><br>Controle total sobre suas campanhas e painéis digitais em tempo real</p>
          </div>
          <div class="benefit-item">
            <span class="benefit-icon">🎯</span>
            <p class="benefit-text"><strong>Alcance Estratégico</strong><br>Impacte seu público-alvo nos locais mais relevantes</p>
          </div>
          <div class="benefit-item">
            <span class="benefit-icon">📈</span>
            <p class="benefit-text"><strong>Relatórios Detalhados</strong><br>Acompanhe métricas e resultados de suas campanhas</p>
          </div>
          <div class="benefit-item">
            <span class="benefit-icon">⚡</span>
            <p class="benefit-text"><strong>Atualizações Instantâneas</strong><br>Altere conteúdo a qualquer momento, de qualquer lugar</p>
          </div>
        </div>
        
        <p style="font-size: 14px; color: #718096;">Este link é válido por 24 horas. Caso expire, você pode solicitar um novo link na página de login.</p>
      </div>
      
      <div class="footer">
        <p><strong>Precisa de ajuda?</strong></p>
        <p>Entre em contato: <a href="mailto:suporte@examidia.com.br">suporte@examidia.com.br</a></p>
        <p style="margin-top: 20px;">© 2025 EXA - Soluções Digitais LTDA. Todos os direitos reservados.</p>
        <p style="font-size: 12px; color: #a0aec0;">Caso você não tenha se cadastrado, pode ignorar este e-mail com segurança.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }

  static createResendHTML(userName: string, confirmationUrl: string): string {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmação de Email - EXA</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      -webkit-font-smoothing: antialiased;
    }
    
    .container {
      max-width: 600px;
      margin: 40px auto;
      padding: 20px;
    }
    
    .email-container {
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px;
      text-align: center;
    }
    
    .logo {
      font-size: 48px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: 4px;
      margin: 0;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    }
    
    .content {
      padding: 40px;
      text-align: center;
      background: #ffffff;
    }
    
    h1 {
      font-size: 28px;
      font-weight: 700;
      color: #1a202c;
      margin: 0 0 20px;
    }
    
    p {
      font-size: 16px;
      line-height: 1.6;
      color: #4a5568;
      margin: 0 0 24px;
    }
    
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      font-weight: 600;
      text-decoration: none;
      padding: 16px 40px;
      border-radius: 50px;
      font-size: 16px;
      margin: 20px 0;
      text-align: center;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }
    
    .alert-box {
      background: #fef5e7;
      border-left: 4px solid #f39c12;
      padding: 16px;
      border-radius: 8px;
      margin: 24px 0;
      text-align: left;
    }
    
    .alert-box p {
      color: #7d6608;
      margin: 0;
      font-size: 14px;
    }
    
    .footer {
      padding: 32px 40px;
      text-align: center;
      background: #f7fafc;
      border-top: 1px solid #e2e8f0;
    }
    
    .footer p {
      font-size: 13px;
      color: #718096;
      margin: 8px 0;
    }
    
    @media screen and (max-width: 480px) {
      .container {
        padding: 10px;
        margin: 20px auto;
      }
      
      .header, .content, .footer {
        padding: 24px 20px;
      }
      
      h1 {
        font-size: 24px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="email-container">
      <div class="header">
        <h1 class="logo">EXA</h1>
      </div>
      
      <div class="content">
        <h1>📧 Confirmação de E-mail (Reenviado)</h1>
        <p>Olá, ${userName}!</p>
        <p>Você solicitou o reenvio do link de confirmação de e-mail. Clique no botão abaixo para ativar sua conta:</p>
        
        <a href="${confirmationUrl}" class="button">✨ Confirmar E-mail</a>
        
        <div class="alert-box">
          <p><strong>⏰ Atenção:</strong> Este link expira em 24 horas. Certifique-se de confirmar seu e-mail antes que ele expire.</p>
        </div>
        
        <p style="font-size: 14px; color: #718096; margin-top: 24px;">
          <strong>Problemas para confirmar?</strong><br>
          • Verifique se está usando o link mais recente<br>
          • Tente abrir em outro navegador<br>
          • Entre em contato com nosso suporte
        </p>
      </div>
      
      <div class="footer">
        <p><strong>Precisa de ajuda?</strong></p>
        <p>Entre em contato: <a href="mailto:suporte@examidia.com.br" style="color: #667eea; text-decoration: none;">suporte@examidia.com.br</a></p>
        <p style="margin-top: 20px;">© 2025 EXA - Soluções Digitais LTDA. Todos os direitos reservados.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }

  static createPasswordRecoveryHTML(userName: string, recoveryUrl: string): string {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recuperação de Senha - EXA</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      -webkit-font-smoothing: antialiased;
    }
    
    .container {
      max-width: 600px;
      margin: 40px auto;
      padding: 20px;
    }
    
    .email-container {
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px;
      text-align: center;
    }
    
    .logo {
      font-size: 48px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: 4px;
      margin: 0;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    }
    
    .content {
      padding: 40px;
      text-align: center;
      background: #ffffff;
    }
    
    h1 {
      font-size: 28px;
      font-weight: 700;
      color: #1a202c;
      margin: 0 0 20px;
    }
    
    p {
      font-size: 16px;
      line-height: 1.6;
      color: #4a5568;
      margin: 0 0 24px;
    }
    
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      font-weight: 600;
      text-decoration: none;
      padding: 16px 40px;
      border-radius: 50px;
      font-size: 16px;
      margin: 20px 0;
      text-align: center;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }
    
    .security-box {
      background: #fff5f5;
      border-left: 4px solid #e53e3e;
      padding: 20px;
      border-radius: 8px;
      margin: 24px 0;
      text-align: left;
    }
    
    .security-box h3 {
      color: #c53030;
      font-size: 16px;
      margin: 0 0 12px;
    }
    
    .security-box ul {
      margin: 0;
      padding-left: 20px;
      color: #742a2a;
    }
    
    .security-box li {
      margin-bottom: 8px;
      font-size: 14px;
    }
    
    .expiry-notice {
      background: #edf2f7;
      padding: 16px;
      border-radius: 8px;
      margin: 24px 0;
    }
    
    .expiry-notice p {
      color: #2d3748;
      font-size: 14px;
      margin: 0;
    }
    
    .footer {
      padding: 32px 40px;
      text-align: center;
      background: #f7fafc;
      border-top: 1px solid #e2e8f0;
    }
    
    .footer p {
      font-size: 13px;
      color: #718096;
      margin: 8px 0;
    }
    
    @media screen and (max-width: 480px) {
      .container {
        padding: 10px;
        margin: 20px auto;
      }
      
      .header, .content, .footer {
        padding: 24px 20px;
      }
      
      h1 {
        font-size: 24px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="email-container">
      <div class="header">
        <h1 class="logo">EXA</h1>
      </div>
      
      <div class="content">
        <h1>🔒 Recuperação de Senha</h1>
        <p>Olá, ${userName}!</p>
        <p>Recebemos uma solicitação para redefinir a senha da sua conta. Se foi você quem solicitou, clique no botão abaixo para criar uma nova senha:</p>
        
        <a href="${recoveryUrl}" class="button">🔑 Redefinir Minha Senha</a>
        
        <div class="expiry-notice">
          <p><strong>⏰ Este link expira em 1 hora</strong><br>Por motivos de segurança, você precisa redefinir sua senha dentro deste período.</p>
        </div>
        
        <div class="security-box">
          <h3>🛡️ Dicas de Segurança</h3>
          <ul>
            <li><strong>Não compartilhe este link</strong> com ninguém</li>
            <li>Se você <strong>não solicitou</strong> esta recuperação, ignore este e-mail e sua senha permanecerá a mesma</li>
            <li>Escolha uma senha <strong>forte e única</strong> com no mínimo 8 caracteres</li>
            <li>Considere usar um <strong>gerenciador de senhas</strong></li>
            <li>Após alterar a senha, você precisará fazer login novamente em todos os dispositivos</li>
          </ul>
        </div>
        
        <p style="font-size: 14px; color: #718096; margin-top: 32px;">
          <strong>Não consegue clicar no botão?</strong><br>
          Copie e cole este link no seu navegador:<br>
          <span style="color: #667eea; word-break: break-all; font-size: 12px;">${recoveryUrl}</span>
        </p>
      </div>
      
      <div class="footer">
        <p><strong>Suspeita de atividade não autorizada?</strong></p>
        <p>Entre em contato imediatamente: <a href="mailto:seguranca@examidia.com.br" style="color: #e53e3e; text-decoration: none;">seguranca@examidia.com.br</a></p>
        <p style="margin-top: 20px;">© 2025 EXA - Soluções Digitais LTDA. Todos os direitos reservados.</p>
        <p style="font-size: 12px; color: #a0aec0;">Este é um e-mail automático de segurança. Não responda a este e-mail.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }
}
