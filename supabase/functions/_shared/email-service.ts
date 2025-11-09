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

  async sendConfirmationEmail(data: EmailTemplates.ConfirmationEmailData) {
    const html = EmailTemplates.createConfirmationEmail(data);
    
    return await this.resend.emails.send({
      from: this.fromAddress,
      to: [data.userEmail],
      subject: '🎯 Confirme seu email na EXA - Bem-vindo!',
      html
    });
  }

  async sendResendConfirmationEmail(data: EmailTemplates.ConfirmationEmailData) {
    const html = EmailTemplates.createResendConfirmationEmail(data);
    
    return await this.resend.emails.send({
      from: this.fromAddress,
      to: [data.userEmail],
      subject: '🎯 Confirme seu email na EXA (Reenviado)',
      html
    });
  }

  async sendPasswordRecoveryEmail(data: EmailTemplates.PasswordRecoveryEmailData) {
    const html = EmailTemplates.createPasswordRecoveryEmail(data);
    
    return await this.resend.emails.send({
      from: this.fromAddress,
      to: [data.userEmail],
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
  // VÍDEOS
  // ==========================================

  async sendVideoSubmittedEmail(data: EmailTemplates.VideoSubmittedEmailData) {
    const html = EmailTemplates.createVideoSubmittedEmail(data);
    
    return await this.resend.emails.send({
      from: this.fromAddress,
      to: [data.userEmail],
      subject: '🎬 Vídeo Recebido - Em Análise | EXA',
      html
    });
  }

  async sendVideoApprovedEmail(data: EmailTemplates.VideoApprovedEmailData) {
    const html = EmailTemplates.createVideoApprovedEmail(data);
    
    return await this.resend.emails.send({
      from: this.fromAddress,
      to: [data.userEmail],
      subject: '🎉 Parabéns! Seu Vídeo Foi Aprovado | EXA',
      html
    });
  }

  async sendVideoRejectedEmail(data: EmailTemplates.VideoRejectedEmailData) {
    const html = EmailTemplates.createVideoRejectedEmail(data);
    
    return await this.resend.emails.send({
      from: this.fromAddress,
      to: [data.userEmail],
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
