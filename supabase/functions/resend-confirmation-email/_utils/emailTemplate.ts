
export function createConfirmationEmailHTML(userName: string, confirmationUrl: string): string {
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
        <p>Você solicitou o reenvio do email de confirmação. Clique no botão abaixo para confirmar seu email:</p>
        <div style="text-align: center;">
          <a href="${confirmationUrl}" class="button">
            ✅ Confirmar Email
          </a>
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
