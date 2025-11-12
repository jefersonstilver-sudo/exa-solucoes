
import { Resend } from "npm:resend@4.0.0";
import * as EmailTemplates from "../_shared/email-templates/index.ts";

export class EmailService {
  private resend: Resend;
  private supabaseUrl: string;
  private supabaseKey: string;

  constructor(apiKey: string, supabaseUrl: string, supabaseKey: string) {
    this.resend = new Resend(apiKey);
    this.supabaseUrl = supabaseUrl;
    this.supabaseKey = supabaseKey;
  }

  private async logEmail(data: {
    email_type: string;
    recipient_email: string;
    recipient_id?: string;
    recipient_name?: string;
    status: string;
    resend_email_id?: string;
    error_message?: string;
    retry_count?: number;
    pedido_id?: string;
    video_id?: string;
    metadata?: any;
  }) {
    try {
      const response = await fetch(`${this.supabaseUrl}/rest/v1/email_audit_log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        console.error('❌ [EMAIL LOG] Erro ao salvar log:', await response.text());
      }
    } catch (error) {
      console.error('❌ [EMAIL LOG] Erro ao salvar log:', error);
    }
  }

  async sendConfirmationEmail(userEmail: string, userName: string, confirmationUrl: string) {
    const html = EmailTemplates.createConfirmationEmail({
      userEmail,
      userName,
      confirmationUrl
    });

    try {
      console.log('📧 [EMAIL] Enviando confirmação para:', userEmail);
      const result = await this.resend.emails.send({
        from: 'EXA <noreply@examidia.com.br>',
        to: [userEmail],
        subject: '🎯 Confirme seu email na EXA - Bem-vindo!',
        html,
      });

      await this.logEmail({
        email_type: 'confirmation',
        recipient_email: userEmail,
        recipient_name: userName,
        status: 'sent',
        resend_email_id: result.data?.id,
      });

      console.log('✅ [EMAIL] Confirmação enviada:', result.data?.id);
      return result;
    } catch (error: any) {
      console.error('❌ [EMAIL] Erro ao enviar confirmação:', error);
      await this.logEmail({
        email_type: 'confirmation',
        recipient_email: userEmail,
        recipient_name: userName,
        status: 'failed',
        error_message: error.message,
      });
      throw error;
    }
  }

  async sendResendConfirmationEmail(userEmail: string, userName: string, confirmationUrl: string) {
    const html = EmailTemplates.createResendConfirmationEmail({
      userEmail,
      userName,
      confirmationUrl
    });

    return await this.resend.emails.send({
      from: 'EXA <noreply@examidia.com.br>',
      to: [userEmail],
      subject: '🎯 Confirme seu email na EXA (Reenviado)',
      html,
    });
  }

  async sendPasswordRecoveryEmail(userEmail: string, userName: string, recoveryUrl: string) {
    const html = EmailTemplates.createPasswordRecoveryEmail({
      userEmail,
      userName,
      recoveryUrl
    });

    return await this.resend.emails.send({
      from: 'EXA <noreply@examidia.com.br>',
      to: [userEmail],
      subject: '🔒 Recuperação de senha - EXA',
      html,
    });
  }

  async sendVideoSubmittedEmail(userEmail: string, userName: string, videoTitle: string, orderId: string, userId?: string, videoId?: string) {
    const html = EmailTemplates.createVideoSubmittedEmail({
      userEmail,
      userName,
      videoTitle,
      orderId
    });

    try {
      console.log('📧 [EMAIL] Enviando confirmação de submissão para:', userEmail);
      const result = await this.resend.emails.send({
        from: 'EXA <noreply@examidia.com.br>',
        to: [userEmail],
        subject: '🎬 Vídeo Recebido - Em Análise | EXA',
        html,
      });

      await this.logEmail({
        email_type: 'video_submitted',
        recipient_email: userEmail,
        recipient_id: userId,
        recipient_name: userName,
        status: 'sent',
        resend_email_id: result.data?.id,
        pedido_id: orderId,
        video_id: videoId,
        metadata: { videoTitle },
      });

      console.log('✅ [EMAIL] Submissão enviada:', result.data?.id);
      return result;
    } catch (error: any) {
      console.error('❌ [EMAIL] Erro ao enviar submissão:', error);
      await this.logEmail({
        email_type: 'video_submitted',
        recipient_email: userEmail,
        recipient_id: userId,
        recipient_name: userName,
        status: 'failed',
        error_message: error.message,
        pedido_id: orderId,
        video_id: videoId,
      });
      throw error;
    }
  }

  async sendVideoApprovedEmail(
    userEmail: string, 
    userName: string, 
    videoTitle: string, 
    buildings: string[], 
    startDate: string, 
    endDate: string, 
    orderId: string,
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
      orderId
    });

    try {
      console.log('📧 [EMAIL] Enviando aprovação de vídeo para:', userEmail);
      const result = await this.resend.emails.send({
        from: 'EXA <noreply@examidia.com.br>',
        to: [userEmail],
        subject: '🎉 Parabéns! Seu Vídeo Foi Aprovado | EXA',
        html,
      });

      await this.logEmail({
        email_type: 'video_approved',
        recipient_email: userEmail,
        recipient_id: userId,
        recipient_name: userName,
        status: 'sent',
        resend_email_id: result.data?.id,
        pedido_id: orderId,
        video_id: videoId,
        metadata: { buildings, videoTitle },
      });

      console.log('✅ [EMAIL] Aprovação enviada:', result.data?.id);
      return result;
    } catch (error: any) {
      console.error('❌ [EMAIL] Erro ao enviar aprovação:', error);
      await this.logEmail({
        email_type: 'video_approved',
        recipient_email: userEmail,
        recipient_id: userId,
        recipient_name: userName,
        status: 'failed',
        error_message: error.message,
        pedido_id: orderId,
        video_id: videoId,
      });
      throw error;
    }
  }

  async sendVideoRejectedEmail(
    userEmail: string, 
    userName: string, 
    videoTitle: string, 
    rejectionReason: string, 
    orderId: string,
    userId?: string,
    videoId?: string
  ) {
    const html = EmailTemplates.createVideoRejectedEmail({
      userEmail,
      userName,
      videoTitle,
      rejectionReason,
      orderId
    });

    try {
      console.log('📧 [EMAIL] Enviando rejeição de vídeo para:', userEmail);
      const result = await this.resend.emails.send({
        from: 'EXA <noreply@examidia.com.br>',
        to: [userEmail],
        subject: '⚠️ Vídeo Precisa de Ajustes | EXA',
        html,
      });

      await this.logEmail({
        email_type: 'video_rejected',
        recipient_email: userEmail,
        recipient_id: userId,
        recipient_name: userName,
        status: 'sent',
        resend_email_id: result.data?.id,
        pedido_id: orderId,
        video_id: videoId,
        metadata: { videoTitle, rejectionReason },
      });

      console.log('✅ [EMAIL] Rejeição enviada:', result.data?.id);
      return result;
    } catch (error: any) {
      console.error('❌ [EMAIL] Erro ao enviar rejeição:', error);
      await this.logEmail({
        email_type: 'video_rejected',
        recipient_email: userEmail,
        recipient_id: userId,
        recipient_name: userName,
        status: 'failed',
        error_message: error.message,
        pedido_id: orderId,
        video_id: videoId,
      });
      throw error;
    }
  }
}
