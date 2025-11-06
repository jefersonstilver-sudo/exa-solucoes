
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

  async sendVideoSubmittedEmail(userEmail: string, userName: string, videoTitle: string, orderId: string) {
    const html = EmailTemplates.createVideoSubmittedHTML(userName, videoTitle, orderId);

    return await this.resend.emails.send({
      from: 'EXA <noreply@examidia.com.br>',
      to: [userEmail],
      subject: '🎬 Vídeo Recebido - Em Análise | EXA',
      html,
    });
  }

  async sendVideoApprovedEmail(
    userEmail: string, 
    userName: string, 
    videoTitle: string, 
    buildings: string[], 
    startDate: string, 
    endDate: string, 
    orderId: string
  ) {
    const html = EmailTemplates.createVideoApprovedHTML(userName, videoTitle, buildings, startDate, endDate, orderId);

    return await this.resend.emails.send({
      from: 'EXA <noreply@examidia.com.br>',
      to: [userEmail],
      subject: '🎉 Parabéns! Seu Vídeo Foi Aprovado | EXA',
      html,
    });
  }

  async sendVideoRejectedEmail(
    userEmail: string, 
    userName: string, 
    videoTitle: string, 
    rejectionReason: string, 
    orderId: string
  ) {
    const html = EmailTemplates.createVideoRejectedHTML(userName, videoTitle, rejectionReason, orderId);

    return await this.resend.emails.send({
      from: 'EXA <noreply@examidia.com.br>',
      to: [userEmail],
      subject: '⚠️ Vídeo Precisa de Ajustes | EXA',
      html,
    });
  }
}
