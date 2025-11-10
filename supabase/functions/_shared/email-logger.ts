import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

export interface EmailLogData {
  template_id: string;
  recipient_email: string;
  recipient_name?: string;
  subject: string;
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed';
  resend_id?: string;
  metadata?: any;
  error_message?: string;
}

export class EmailLogger {
  private supabase;

  constructor() {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  async log(data: EmailLogData): Promise<void> {
    try {
      console.log(`📝 [EMAIL-LOGGER] Registrando email: ${data.template_id} para ${data.recipient_email}`);
      
      const { error } = await this.supabase
        .from('email_logs')
        .insert({
          template_id: data.template_id,
          recipient_email: data.recipient_email,
          recipient_name: data.recipient_name || null,
          subject: data.subject,
          status: data.status,
          resend_id: data.resend_id || null,
          metadata: data.metadata || {},
          error_message: data.error_message || null,
          sent_at: new Date().toISOString(),
        });

      if (error) {
        console.error('❌ [EMAIL-LOGGER] Erro ao registrar email:', error);
      } else {
        console.log('✅ [EMAIL-LOGGER] Email registrado com sucesso');
      }
    } catch (error: any) {
      console.error('💥 [EMAIL-LOGGER] Erro crítico ao registrar email:', error);
    }
  }

  async logSuccess(
    templateId: string,
    recipientEmail: string,
    subject: string,
    resendId: string,
    recipientName?: string,
    metadata?: any
  ): Promise<void> {
    await this.log({
      template_id: templateId,
      recipient_email: recipientEmail,
      recipient_name: recipientName,
      subject: subject,
      status: 'sent',
      resend_id: resendId,
      metadata: metadata,
    });
  }

  async logFailure(
    templateId: string,
    recipientEmail: string,
    subject: string,
    errorMessage: string,
    recipientName?: string,
    metadata?: any
  ): Promise<void> {
    await this.log({
      template_id: templateId,
      recipient_email: recipientEmail,
      recipient_name: recipientName,
      subject: subject,
      status: 'failed',
      error_message: errorMessage,
      metadata: metadata,
    });
  }
}
