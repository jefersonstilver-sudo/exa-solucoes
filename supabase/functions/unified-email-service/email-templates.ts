
export class EmailTemplates {
  static createConfirmationHTML(userName: string, confirmationUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bem-vindo à Indexa</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            margin: 0; padding: 0; background-color: #f9f9f9; color: #ffffff;
            -webkit-font-smoothing: antialiased;
          }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .email-container {
            background: linear-gradient(135deg, #1A1F2C 0%, #2c3347 100%);
            border-radius: 12px; overflow: hidden;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          }
          .header { padding: 30px 40px; text-align: center; }
          .logo { max-width: 160px; margin-bottom: 20px; }
          .content { padding: 20px 40px 40px; text-align: center; }
          h1 { font-size: 28px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 16px; }
          p { font-size: 16px; line-height: 1.6; color: #e1e1e6; margin: 0 0 24px; }
          .button {
            display: inline-block; background-color: #00FFAB; color: #1A1F2C;
            font-weight: 600; text-decoration: none; padding: 14px 32px;
            border-radius: 8px; font-size: 16px; margin: 16px 0;
            text-align: center; transition: all 0.2s ease;
            box-shadow: 0 0 15px rgba(0, 255, 171, 0.5);
          }
          .footer {
            padding: 20px 40px; text-align: center;
            background-color: rgba(0, 0, 0, 0.15);
          }
          .footer p { font-size: 12px; color: #9ca3af; margin: 0; }
          @media screen and (max-width: 480px) {
            .container { padding: 10px; }
            .header, .content, .footer { padding-left: 20px; padding-right: 20px; }
            h1 { font-size: 24px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="email-container">
            <div class="header">
              <div style="color: #00FFAB; font-size: 32px; font-weight: bold;">INDEXA</div>
            </div>
            <div class="content">
              <h1>🎉 Bem-vindo à Indexa!</h1>
              <p>Olá ${userName}! Para ativar sua conta e garantir o acesso completo à nossa plataforma de painéis digitais, clique no botão abaixo para confirmar seu e-mail:</p>
              <a href="${confirmationUrl}" class="button">Ativar minha conta</a>
              <p style="font-size: 14px; margin-top: 24px;">Este é um passo essencial para garantir sua segurança e permitir que você acompanhe suas campanhas com total controle e suporte.</p>
            </div>
            <div class="footer">
              <p>Caso você não tenha se cadastrado, apenas ignore este e-mail.</p>
              <p style="margin-top: 8px;">© 2025 Indexa Mídia. Todos os direitos reservados.</p>
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
      <html>
      <head>
        <meta charset="utf-8">
        <title>Confirme seu Email - Indexa</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .logo { text-align: center; color: #7c3aed; font-size: 32px; font-weight: bold; margin-bottom: 30px; }
          .button { background: #7c3aed; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; margin: 20px 0; }
          .footer { color: #999; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">INDEXA</div>
          <h2>Confirme seu email novamente</h2>
          <p>Olá ${userName}! Você solicitou o reenvio do email de confirmação. Clique no botão abaixo para confirmar seu email:</p>
          <div style="text-align: center;">
            <a href="${confirmationUrl}" class="button">✅ Confirmar Email</a>
          </div>
          <p>Ou copie e cole este link no seu navegador:</p>
          <p style="word-break: break-all; background: #f8f8f8; padding: 10px; border-radius: 5px; font-size: 12px;">
            ${confirmationUrl}
          </p>
          <div class="footer">
            <p>Se você não solicitou este reenvio, pode ignorar este email.</p>
            <p>Este link expira em 24 horas por segurança.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
