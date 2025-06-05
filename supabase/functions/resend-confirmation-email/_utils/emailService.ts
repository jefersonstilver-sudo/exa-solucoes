
import { Resend } from "npm:resend@4.0.0";
import { createConfirmationEmailHTML } from "./emailTemplate.ts";

export class EmailService {
  private resend: Resend;

  constructor(apiKey: string) {
    this.resend = new Resend(apiKey);
  }

  async sendResendConfirmationEmail(
    userEmail: string, 
    userName: string, 
    confirmationUrl: string
  ) {
    const html = createConfirmationEmailHTML(userName, confirmationUrl);

    return await this.resend.emails.send({
      from: 'Indexa <noreply@indexamidia.com>',
      to: [userEmail],
      subject: '🎯 Confirme seu email na Indexa (Reenviado)',
      html,
    });
  }
}
