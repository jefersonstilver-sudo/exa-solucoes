
import { Resend } from "npm:resend@4.0.0";
import { EmailTemplates } from "./email-templates.ts";

export class EmailService {
  private resend: Resend;

  constructor(apiKey: string) {
    this.resend = new Resend(apiKey);
  }

  async sendConfirmationEmail(userEmail: string, userName: string, confirmationUrl: string) {
    const html = EmailTemplates.createConfirmationHTML(userName, confirmationUrl);

    return await this.resend.emails.send({
      from: 'EXA <noreply@examidia.com.br>',
      to: [userEmail],
      subject: '🎯 Confirme seu email na EXA - Bem-vindo!',
      html,
    });
  }

  async sendResendConfirmationEmail(userEmail: string, userName: string, confirmationUrl: string) {
    const html = EmailTemplates.createResendHTML(userName, confirmationUrl);

    return await this.resend.emails.send({
      from: 'EXA <noreply@examidia.com.br>',
      to: [userEmail],
      subject: '🎯 Confirme seu email na EXA (Reenviado)',
      html,
    });
  }

  async sendPasswordRecoveryEmail(userEmail: string, userName: string, recoveryUrl: string) {
    const html = EmailTemplates.createPasswordRecoveryHTML(userName, recoveryUrl);

    return await this.resend.emails.send({
      from: 'EXA <noreply@examidia.com.br>',
      to: [userEmail],
      subject: '🔒 Recuperação de senha - EXA',
      html,
    });
  }
}
