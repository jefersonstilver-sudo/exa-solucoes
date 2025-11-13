// ============================================
// TEMPLATES DE AUTENTICAÇÃO
// ============================================
// 🔄 FORÇAR REDEPLOY: 2025-11-13T00:42:00Z
// ✅ Versão moderna com gradientes e estilos profissionais

import { createEmailTemplate } from './base.ts';
import type { ConfirmationEmailData, PasswordRecoveryEmailData } from './types.ts';

// Email de confirmação inicial (signup)
export function createConfirmationEmail(data: ConfirmationEmailData): string {
  const content = `
    <h1 class="greeting">Bem-vindo à EXA, ${data.userName}!</h1>
    
    <p class="message">
      Estamos muito felizes em tê-lo conosco. Para começar a utilizar nossa plataforma de painéis digitais 
      e gerenciar suas campanhas publicitárias, precisamos que você confirme seu endereço de e-mail.
    </p>
    
    <div class="cta-container">
      <a href="${data.confirmationUrl}" class="cta-button">✓ Confirmar E-mail</a>
    </div>
    
    <div class="info-box">
      <p><strong>Por que confirmar seu e-mail?</strong></p>
      <p style="margin-top: 8px;">
        A confirmação garante a segurança da sua conta e permite que você receba notificações importantes 
        sobre suas campanhas, além de possibilitar a recuperação de senha caso necessário.
      </p>
    </div>
    
    <div class="divider"></div>
    
    <p class="message" style="font-size: 14px; color: #666666; margin-bottom: 0;">
      Este link de confirmação é válido por <strong>24 horas</strong>. Caso expire, você poderá 
      solicitar um novo através da página de login.
    </p>
  `;

  return createEmailTemplate({
    title: '🎯 Confirme seu E-mail',
    subtitle: 'Bem-vindo à Publicidade Inteligente',
    content,
    footerText: 'Se você não se cadastrou na EXA, pode ignorar este e-mail com segurança.'
  });
}

// Email de reenvio de confirmação
export function createResendConfirmationEmail(data: ConfirmationEmailData): string {
  const content = `
    <h1 class="greeting">Olá, ${data.userName}!</h1>
    
    <p class="message">
      Você solicitou o reenvio do link de confirmação de e-mail. Clique no botão abaixo para 
      ativar sua conta e começar a usar a plataforma EXA:
    </p>
    
    <div class="cta-container">
      <a href="${data.confirmationUrl}" class="cta-button">✓ Confirmar E-mail</a>
    </div>
    
    <div style="background-color: #fafafa; border: 1px solid #e0e0e0; padding: 16px 20px; margin: 24px 0; border-radius: 8px;">
      <p style="font-size: 13px; color: #666666; margin: 0 0 8px 0; font-weight: 500;">
        Ou copie e cole este link no seu navegador:
      </p>
      <div style="background-color: #ffffff; border: 1px solid #d0d0d0; padding: 12px; border-radius: 4px; word-break: break-all; font-family: monospace; font-size: 12px; color: #333333; line-height: 1.5;">
        ${data.confirmationUrl}
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
  `;

  return createEmailTemplate({
    title: '🔄 Confirme seu E-mail',
    subtitle: 'Link Reenviado',
    content,
    footerText: 'Se você não solicitou este e-mail, pode ignorá-lo com segurança.'
  });
}

// Email de recuperação de senha
export function createPasswordRecoveryEmail(data: PasswordRecoveryEmailData): string {
  const content = `
    <h1 class="greeting">🔒 Recuperação de Senha</h1>
    
    <p class="message">
      Olá, ${data.userName}!
    </p>
    
    <p class="message">
      Recebemos uma solicitação para redefinir a senha da sua conta. Se foi você quem solicitou, 
      clique no botão abaixo para criar uma nova senha:
    </p>
    
    <div class="cta-container">
      <a href="${data.recoveryUrl}" class="cta-button">🔑 Redefinir Senha</a>
    </div>
    
    <div class="warning-box" style="background: #fff5f5; border-left-color: #ef4444;">
      <p style="color: #991b1b;"><strong>⏰ Este link expira em 1 hora</strong></p>
      <p style="margin-top: 8px; color: #991b1b;">
        Por motivos de segurança, você precisa redefinir sua senha dentro deste período.
      </p>
    </div>
    
    <div class="info-box" style="background: #dbeafe; border-left-color: #3b82f6;">
      <p style="color: #1e40af;"><strong>🛡️ Dicas de Segurança</strong></p>
      <p style="margin-top: 12px; color: #1e3a8a;">
        • <strong>Não compartilhe este link</strong> com ninguém<br>
        • Se você <strong>não solicitou</strong> esta recuperação, ignore este e-mail<br>
        • Escolha uma senha <strong>forte e única</strong> com no mínimo 8 caracteres<br>
        • Considere usar um <strong>gerenciador de senhas</strong><br>
        • Após alterar a senha, você precisará fazer login novamente
      </p>
    </div>
    
    <div class="divider"></div>
    
    <p style="font-size: 14px; color: #718096; text-align: center; margin: 0;">
      <strong>Não consegue clicar no botão?</strong><br>
      Copie e cole este link no seu navegador:<br>
      <span style="color: #7D1818; word-break: break-all; font-size: 12px; font-family: monospace;">${data.recoveryUrl}</span>
    </p>
  `;

  return createEmailTemplate({
    title: 'Recuperação de Senha',
    subtitle: 'Redefina seu Acesso',
    content,
    footerText: 'Suspeita de atividade não autorizada? Entre em contato: seguranca@examidia.com.br'
  });
}
