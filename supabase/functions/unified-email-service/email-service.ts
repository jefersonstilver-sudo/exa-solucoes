
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
      from: 'Indexa <noreply@indexamidia.com.br>',
      to: [userEmail],
      subject: '🎯 Confirme seu email na Indexa - Bem-vindo!',
      html,
    });
  }

  async sendResendConfirmationEmail(userEmail: string, userName: string, confirmationUrl: string) {
    const html = EmailTemplates.createResendHTML(userName, confirmationUrl);

    return await this.resend.emails.send({
      from: 'Indexa <noreply@indexamidia.com.br>',
      to: [userEmail],
      subject: '🎯 Confirme seu email na Indexa (Reenviado)',
      html,
    });
  }
}
