import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import * as EmailTemplates from '../_shared/email-templates/index.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RenderEmailRequest {
  templateId: string;
  data: any;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { templateId, data }: RenderEmailRequest = await req.json();

    console.log(`Rendering email template: ${templateId}`);

    let html: string;

    // Renderizar o template apropriado
    switch (templateId) {
      case 'confirmation':
        html = EmailTemplates.createConfirmationEmail(data);
        break;
      case 'resend_confirmation':
        html = EmailTemplates.createResendConfirmationEmail(data);
        break;
      case 'password_recovery':
        html = EmailTemplates.createPasswordRecoveryEmail(data);
        break;
      case 'admin_welcome':
        html = EmailTemplates.createAdminWelcomeEmail(data);
        break;
      case 'video_submitted':
        html = EmailTemplates.createVideoSubmittedEmail(data);
        break;
      case 'video_approved':
        html = EmailTemplates.createVideoApprovedEmail(data);
        break;
      case 'video_rejected':
        html = EmailTemplates.createVideoRejectedEmail(data);
        break;
      case 'benefit_invitation':
        html = EmailTemplates.createBenefitInvitationEmail(data);
        break;
      case 'benefit_code':
        html = EmailTemplates.createBenefitGiftCodeEmail(data);
        break;
      default:
        return new Response(
          JSON.stringify({ error: `Template '${templateId}' não encontrado` }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
    }

    console.log(`Template ${templateId} rendered successfully`);

    return new Response(
      JSON.stringify({ html }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error('Error rendering email template:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
