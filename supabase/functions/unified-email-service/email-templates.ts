
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

  static createVideoSubmittedHTML(userName: string, videoTitle: string, orderId: string): string {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vídeo Recebido - EXA</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      background: linear-gradient(135deg, #4299e1 0%, #667eea 100%);
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
      background: linear-gradient(135deg, #4299e1 0%, #667eea 100%);
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
    
    .video-info {
      background: #f7fafc;
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
      text-align: left;
    }
    
    .info-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
      padding-bottom: 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .info-item:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }
    
    .info-label {
      color: #718096;
      font-size: 14px;
    }
    
    .info-value {
      color: #1a202c;
      font-weight: 600;
      font-size: 14px;
    }
    
    .timeline {
      background: #edf2f7;
      border-radius: 12px;
      padding: 20px;
      margin: 24px 0;
      text-align: left;
    }
    
    .timeline h3 {
      color: #2d3748;
      font-size: 16px;
      margin: 0 0 16px;
    }
    
    .timeline-item {
      display: flex;
      align-items: start;
      margin-bottom: 12px;
    }
    
    .timeline-icon {
      font-size: 20px;
      margin-right: 12px;
    }
    
    .timeline-text {
      flex: 1;
      color: #4a5568;
      font-size: 14px;
      line-height: 1.5;
    }
    
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #4299e1 0%, #667eea 100%);
      color: #ffffff;
      font-weight: 600;
      text-decoration: none;
      padding: 16px 40px;
      border-radius: 50px;
      font-size: 16px;
      margin: 20px 0;
      text-align: center;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(66, 153, 225, 0.4);
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
        <h1>🎬 Vídeo Recebido com Sucesso!</h1>
        <p>Olá, ${userName}!</p>
        <p>Recebemos seu vídeo "<strong>${videoTitle}</strong>" e ele já está em análise pela nossa equipe!</p>
        
        <div class="video-info">
          <div class="info-item">
            <span class="info-label">📋 Status:</span>
            <span class="info-value">Em Análise</span>
          </div>
          <div class="info-item">
            <span class="info-label">⏱️ Prazo de Análise:</span>
            <span class="info-value">Até 24 horas</span>
          </div>
          <div class="info-item">
            <span class="info-label">📁 Pedido:</span>
            <span class="info-value">#${orderId.substring(0, 8)}</span>
          </div>
        </div>
        
        <div class="timeline">
          <h3>O que acontece agora?</h3>
          <div class="timeline-item">
            <span class="timeline-icon">✓</span>
            <div class="timeline-text">
              <strong>Análise Técnica:</strong> Verificamos qualidade, formato e duração
            </div>
          </div>
          <div class="timeline-item">
            <span class="timeline-icon">✓</span>
            <div class="timeline-text">
              <strong>Conformidade CONAR:</strong> Garantimos que o conteúdo está adequado para ambiente familiar
            </div>
          </div>
          <div class="timeline-item">
            <span class="timeline-icon">✓</span>
            <div class="timeline-text">
              <strong>Aprovação:</strong> Você receberá um email assim que o vídeo for aprovado
            </div>
          </div>
        </div>
        
        <p style="font-size: 14px; color: #718096;">
          Você receberá uma notificação por email assim que seu vídeo for aprovado ou caso precisemos de ajustes.
        </p>
        
        <a href="https://examidia.com.br/painel" class="button">📊 Acompanhar Pedido</a>
      </div>
      
      <div class="footer">
        <p><strong>Precisa de ajuda?</strong></p>
        <p>Entre em contato: <a href="mailto:suporte@examidia.com.br" style="color: #4299e1; text-decoration: none;">suporte@examidia.com.br</a></p>
        <p style="margin-top: 20px;">© 2025 EXA - Soluções Digitais LTDA. Todos os direitos reservados.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }

  static createVideoApprovedHTML(userName: string, videoTitle: string, buildings: string[], startDate: string, endDate: string, orderId: string): string {
    const buildingsList = buildings.map(b => `<li>${b}</li>`).join('');
    
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vídeo Aprovado - EXA</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
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
      background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
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
    
    .confetti {
      font-size: 60px;
      margin-bottom: 20px;
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
    
    .status-badge {
      display: inline-block;
      background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
      color: #ffffff;
      font-weight: 700;
      padding: 12px 32px;
      border-radius: 50px;
      font-size: 18px;
      margin: 20px 0;
      box-shadow: 0 4px 15px rgba(72, 187, 120, 0.4);
    }
    
    .campaign-info {
      background: #f0fff4;
      border: 2px solid #9ae6b4;
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
      text-align: left;
    }
    
    .campaign-info h3 {
      color: #22543d;
      font-size: 18px;
      margin: 0 0 16px;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 20px;
    }
    
    .info-item {
      background: #ffffff;
      padding: 12px;
      border-radius: 8px;
    }
    
    .info-label {
      color: #718096;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    
    .info-value {
      color: #1a202c;
      font-weight: 600;
      font-size: 16px;
    }
    
    .buildings-list {
      background: #ffffff;
      border-radius: 8px;
      padding: 16px;
    }
    
    .buildings-list h4 {
      color: #22543d;
      font-size: 14px;
      margin: 0 0 12px;
    }
    
    .buildings-list ul {
      margin: 0;
      padding-left: 20px;
      color: #4a5568;
      font-size: 14px;
    }
    
    .buildings-list li {
      margin-bottom: 8px;
    }
    
    .next-steps {
      background: #edf2f7;
      border-radius: 12px;
      padding: 20px;
      margin: 24px 0;
      text-align: left;
    }
    
    .next-steps h3 {
      color: #2d3748;
      font-size: 16px;
      margin: 0 0 16px;
    }
    
    .step-item {
      display: flex;
      align-items: start;
      margin-bottom: 12px;
    }
    
    .step-icon {
      font-size: 20px;
      margin-right: 12px;
    }
    
    .step-text {
      flex: 1;
      color: #4a5568;
      font-size: 14px;
    }
    
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
      color: #ffffff;
      font-weight: 600;
      text-decoration: none;
      padding: 16px 40px;
      border-radius: 50px;
      font-size: 16px;
      margin: 20px 0;
      text-align: center;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(72, 187, 120, 0.4);
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
      
      .info-grid {
        grid-template-columns: 1fr;
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
        <div class="confetti">🎉</div>
      </div>
      
      <div class="content">
        <h1>Parabéns! Seu Vídeo Foi Aprovado!</h1>
        <p>Olá, ${userName}!</p>
        <p>Temos ótimas notícias! Seu vídeo "<strong>${videoTitle}</strong>" foi aprovado e já está <strong>ATIVO</strong> nos painéis!</p>
        
        <div class="status-badge">
          📺 EM EXIBIÇÃO
        </div>
        
        <div class="campaign-info">
          <h3>📊 Detalhes da Campanha</h3>
          
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Data Início</div>
              <div class="info-value">${startDate}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Data Término</div>
              <div class="info-value">${endDate}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Painéis Ativos</div>
              <div class="info-value">${buildings.length}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Pedido</div>
              <div class="info-value">#${orderId.substring(0, 8)}</div>
            </div>
          </div>
          
          <div class="buildings-list">
            <h4>📍 Locais de Exibição:</h4>
            <ul>
              ${buildingsList}
            </ul>
          </div>
        </div>
        
        <div class="next-steps">
          <h3>✓ Próximos Passos</h3>
          <div class="step-item">
            <span class="step-icon">📈</span>
            <div class="step-text">
              <strong>Acompanhe métricas:</strong> Visualize impressões e alcance no seu painel
            </div>
          </div>
          <div class="step-item">
            <span class="step-icon">⏰</span>
            <div class="step-text">
              <strong>Gerencie horários:</strong> Configure quando seu vídeo será exibido
            </div>
          </div>
          <div class="step-item">
            <span class="step-icon">🎬</span>
            <div class="step-text">
              <strong>Envie mais vídeos:</strong> Aproveite para criar novas campanhas
            </div>
          </div>
        </div>
        
        <p style="font-size: 14px; color: #2f855a; background: #f0fff4; padding: 16px; border-radius: 8px; border-left: 4px solid #48bb78;">
          <strong>🚀 Seu conteúdo já está alcançando seu público-alvo!</strong><br>
          Acesse seu painel para ver os resultados em tempo real.
        </p>
        
        <a href="https://examidia.com.br/painel" class="button">📊 Ver Meu Painel</a>
      </div>
      
      <div class="footer">
        <p><strong>Precisa de ajuda?</strong></p>
        <p>Entre em contato: <a href="mailto:suporte@examidia.com.br" style="color: #48bb78; text-decoration: none;">suporte@examidia.com.br</a></p>
        <p style="margin-top: 20px;">© 2025 EXA - Soluções Digitais LTDA. Todos os direitos reservados.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }

  static createVideoRejectedHTML(userName: string, videoTitle: string, rejectionReason: string, orderId: string): string {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vídeo Precisa de Ajustes - EXA</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      background: linear-gradient(135deg, #f6ad55 0%, #ed8936 100%);
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
      background: linear-gradient(135deg, #f6ad55 0%, #ed8936 100%);
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
    
    .rejection-box {
      background: #fffaf0;
      border: 2px solid #f6ad55;
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
      text-align: left;
    }
    
    .rejection-box h3 {
      color: #c05621;
      font-size: 18px;
      margin: 0 0 12px;
      display: flex;
      align-items: center;
    }
    
    .rejection-reason {
      background: #ffffff;
      border-left: 4px solid #ed8936;
      padding: 16px;
      border-radius: 8px;
      color: #744210;
      font-size: 15px;
      line-height: 1.6;
      margin-top: 16px;
    }
    
    .guidelines {
      background: #edf2f7;
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
      text-align: left;
    }
    
    .guidelines h3 {
      color: #2d3748;
      font-size: 16px;
      margin: 0 0 16px;
    }
    
    .guidelines ul {
      margin: 0;
      padding-left: 20px;
      color: #4a5568;
      font-size: 14px;
    }
    
    .guidelines li {
      margin-bottom: 12px;
      line-height: 1.5;
    }
    
    .action-steps {
      background: #f0fff4;
      border-radius: 12px;
      padding: 20px;
      margin: 24px 0;
      text-align: left;
    }
    
    .action-steps h3 {
      color: #22543d;
      font-size: 16px;
      margin: 0 0 16px;
    }
    
    .step-item {
      display: flex;
      align-items: start;
      margin-bottom: 12px;
    }
    
    .step-number {
      background: #48bb78;
      color: #ffffff;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      margin-right: 12px;
      flex-shrink: 0;
    }
    
    .step-text {
      flex: 1;
      color: #2d3748;
      font-size: 14px;
      line-height: 1.5;
    }
    
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #f6ad55 0%, #ed8936 100%);
      color: #ffffff;
      font-weight: 600;
      text-decoration: none;
      padding: 16px 40px;
      border-radius: 50px;
      font-size: 16px;
      margin: 20px 0;
      text-align: center;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(237, 137, 54, 0.4);
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
        <h1>⚠️ Vídeo Precisa de Ajustes</h1>
        <p>Olá, ${userName}!</p>
        <p>Agradecemos pelo envio do seu vídeo "<strong>${videoTitle}</strong>". Nossa equipe analisou o conteúdo, mas identificamos alguns pontos que precisam ser ajustados antes da aprovação.</p>
        
        <div class="rejection-box">
          <h3>❌ Motivo da Rejeição:</h3>
          <div class="rejection-reason">
            ${rejectionReason}
          </div>
        </div>
        
        <div class="guidelines">
          <h3>📋 Diretrizes CONAR e Boas Práticas:</h3>
          <ul>
            <li><strong>Conteúdo familiar:</strong> Adequado para ambiente com crianças e famílias</li>
            <li><strong>Linguagem apropriada:</strong> Sem palavrões ou expressões ofensivas</li>
            <li><strong>Imagens adequadas:</strong> Sem violência, conteúdo sexual ou perturbador</li>
            <li><strong>Publicidade responsável:</strong> Sem propaganda enganosa ou inadequada</li>
            <li><strong>Qualidade técnica:</strong> Boa resolução, áudio claro e formato compatível</li>
          </ul>
        </div>
        
        <div class="action-steps">
          <h3>✅ O que fazer agora?</h3>
          <div class="step-item">
            <div class="step-number">1</div>
            <div class="step-text">
              <strong>Revise o vídeo</strong> conforme as orientações acima
            </div>
          </div>
          <div class="step-item">
            <div class="step-number">2</div>
            <div class="step-text">
              <strong>Faça os ajustes necessários</strong> no seu conteúdo
            </div>
          </div>
          <div class="step-item">
            <div class="step-number">3</div>
            <div class="step-text">
              <strong>Envie novamente</strong> pelo seu painel
            </div>
          </div>
        </div>
        
        <p style="font-size: 14px; color: #744210; background: #fffaf0; padding: 16px; border-radius: 8px; border-left: 4px solid #f6ad55;">
          <strong>💡 Dica:</strong> Nossa equipe está à disposição para esclarecer dúvidas e ajudar você a adequar seu conteúdo. Entre em contato conosco!
        </p>
        
        <a href="https://examidia.com.br/painel" class="button">📤 Enviar Novo Vídeo</a>
        
        <p style="font-size: 13px; color: #a0aec0; margin-top: 32px;">
          Pedido: #${orderId.substring(0, 8)}
        </p>
      </div>
      
      <div class="footer">
        <p><strong>Precisa de ajuda?</strong></p>
        <p>Entre em contato: <a href="mailto:suporte@examidia.com.br" style="color: #ed8936; text-decoration: none;">suporte@examidia.com.br</a></p>
        <p style="margin-top: 20px;">© 2025 EXA - Soluções Digitais LTDA. Todos os direitos reservados.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }
}
