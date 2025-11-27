// ============================================
// SERVIÇO CENTRALIZADO DE EMAIL
// ============================================

import { Resend } from 'npm:resend@4.0.0';
import * as EmailTemplates from './email-templates/index.ts';

export class UnifiedEmailService {
  private resend: Resend;
  private fromAddress: string;

  constructor(apiKey: string, fromAddress: string = 'EXA Mídia <noreply@examidia.com.br>') {
    this.resend = new Resend(apiKey);
    this.fromAddress = fromAddress;
  }

  // ==========================================
  // AUTENTICAÇÃO
  // ==========================================

  async sendConfirmationEmail(userEmail: string, userName: string, confirmationUrl: string) {
    const html = EmailTemplates.createConfirmationEmail({
      userEmail,
      userName,
      confirmationUrl
    });
    
    return await this.resend.emails.send({
      from: this.fromAddress,
      to: [userEmail],
      subject: '🎯 Confirme seu email na EXA - Bem-vindo!',
      html
    });
  }

  async sendResendConfirmationEmail(userEmail: string, userName: string, confirmationUrl: string) {
    const html = EmailTemplates.createResendConfirmationEmail({
      userEmail,
      userName,
      confirmationUrl
    });
    
    return await this.resend.emails.send({
      from: this.fromAddress,
      to: [userEmail],
      subject: '🎯 Confirme seu email na EXA (Reenviado)',
      html
    });
  }

  async sendPasswordRecoveryEmail(userEmail: string, userName: string, recoveryUrl: string) {
    const html = EmailTemplates.createPasswordRecoveryEmail({
      userEmail,
      userName,
      recoveryUrl
    });
    
    return await this.resend.emails.send({
      from: this.fromAddress,
      to: [userEmail],
      subject: '🔒 Recuperação de senha - EXA',
      html
    });
  }

  // ==========================================
  // ADMINISTRATIVO
  // ==========================================

  async sendAdminWelcomeEmail(data: EmailTemplates.AdminWelcomeEmailData) {
    const html = EmailTemplates.createAdminWelcomeEmail(data);
    
    return await this.resend.emails.send({
      from: this.fromAddress,
      to: [data.email],
      subject: 'Bem-vindo à Equipe EXA Mídia - Acesso Administrativo',
      html
    });
  }

  // ==========================================
  // RELATÓRIOS DIÁRIOS
  // ==========================================

  async sendDailyReportEmail(
    recipientEmails: string[],
    reportData: EmailTemplates.DailyReportEmailData
  ) {
    const html = EmailTemplates.createDailyReportEmail(reportData);
    
    return await this.resend.emails.send({
      from: this.fromAddress,
      to: recipientEmails,
      subject: `📊 Relatório Diário - ${reportData.agentName} - ${reportData.reportDate}`,
      html
    });
  }

  // ==========================================
  // VÍDEOS
  // ==========================================

  async sendVideoSubmittedEmail(
    userEmail: string,
    userName: string,
    videoTitle: string,
    orderId?: string,
    userId?: string,
    videoId?: string
  ) {
    const html = EmailTemplates.createVideoSubmittedEmail({
      userEmail,
      userName,
      videoTitle,
      orderId,
      userId,
      videoId
    });
    
    return await this.resend.emails.send({
      from: this.fromAddress,
      to: [userEmail],
      subject: '🎬 Vídeo Recebido - Em Análise | EXA',
      html
    });
  }

  async sendVideoApprovedEmail(
    userEmail: string,
    userName: string,
    videoTitle: string,
    buildings: string[],
    startDate: string,
    endDate: string,
    orderId?: string,
    userId?: string,
    videoId?: string
  ) {
    const html = EmailTemplates.createVideoApprovedEmail({
      userEmail,
      userName,
      videoTitle,
      buildings,
      startDate,
      endDate,
      orderId,
      userId,
      videoId
    });
    
    return await this.resend.emails.send({
      from: this.fromAddress,
      to: [userEmail],
      subject: '🎉 Parabéns! Seu Vídeo Foi Aprovado | EXA',
      html
    });
  }

  async sendVideoRejectedEmail(
    userEmail: string,
    userName: string,
    videoTitle: string,
    rejectionReason: string,
    orderId?: string,
    userId?: string,
    videoId?: string
  ) {
    const html = EmailTemplates.createVideoRejectedEmail({
      userEmail,
      userName,
      videoTitle,
      rejectionReason,
      orderId,
      userId,
      videoId
    });
    
    return await this.resend.emails.send({
      from: this.fromAddress,
      to: [userEmail],
      subject: '⚠️ Vídeo Precisa de Ajustes | EXA',
      html
    });
  }

  // ==========================================
  // BENEFÍCIOS
  // ==========================================

  async sendBenefitInvitationEmail(data: EmailTemplates.BenefitInvitationEmailData) {
    const html = EmailTemplates.createBenefitInvitationEmail(data);
    
    return await this.resend.emails.send({
      from: this.fromAddress,
      to: [data.providerEmail],
      subject: '🎉 Parabéns! Você ajudou a ativar mais um ponto EXA!',
      html
    });
  }

  async sendBenefitGiftCodeEmail(data: EmailTemplates.BenefitGiftCodeEmailData) {
    const html = EmailTemplates.createBenefitGiftCodeEmail(data);
    
    return await this.resend.emails.send({
      from: this.fromAddress,
      to: [data.providerEmail],
      subject: '🎁 Aqui está seu presente da EXA!',
      html
    });
  }
}

// Export para uso direto
export { EmailTemplates };
