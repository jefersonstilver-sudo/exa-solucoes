import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import * as EmailTemplates from '../_shared/email-templates/index.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TemplateConfig {
  id: string;
  name: string;
  renderFunction: (data: any) => string;
  sampleData: any;
}

const templates: TemplateConfig[] = [
  {
    id: 'confirmation',
    name: 'Confirmação de Email',
    renderFunction: EmailTemplates.createConfirmationEmail,
    sampleData: {
      userEmail: 'usuario@exemplo.com',
      userName: 'Usuário Exemplo',
      confirmationUrl: 'https://www.examidia.com.br/confirm?token=sample'
    }
  },
  {
    id: 'resend_confirmation',
    name: 'Reenvio de Confirmação',
    renderFunction: EmailTemplates.createResendConfirmationEmail,
    sampleData: {
      userEmail: 'usuario@exemplo.com',
      userName: 'Usuário Exemplo',
      confirmationUrl: 'https://www.examidia.com.br/confirm?token=sample'
    }
  },
  {
    id: 'password_recovery',
    name: 'Recuperação de Senha',
    renderFunction: EmailTemplates.createPasswordRecoveryEmail,
    sampleData: {
      userEmail: 'usuario@exemplo.com',
      userName: 'Usuário Exemplo',
      recoveryUrl: 'https://www.examidia.com.br/reset-password?token=sample'
    }
  },
  {
    id: 'admin_welcome',
    name: 'Boas-vindas Admin',
    renderFunction: EmailTemplates.createAdminWelcomeEmail,
    sampleData: {
      userEmail: 'admin@exemplo.com',
      userName: 'Admin Exemplo',
      nome: 'Admin Exemplo',
      email: 'admin@exemplo.com',
      role: 'admin' as const,
      password: 'senha123',
      createdBy: 'Sistema',
      loginUrl: 'https://www.examidia.com.br/login'
    }
  },
  {
    id: 'video_submitted',
    name: 'Vídeo Recebido',
    renderFunction: EmailTemplates.createVideoSubmittedEmail,
    sampleData: {
      userEmail: 'cliente@exemplo.com',
      userName: 'Cliente Exemplo',
      videoTitle: 'Vídeo Exemplo',
      orderId: 'PED-123'
    }
  },
  {
    id: 'video_approved',
    name: 'Vídeo Aprovado',
    renderFunction: EmailTemplates.createVideoApprovedEmail,
    sampleData: {
      userEmail: 'cliente@exemplo.com',
      userName: 'Cliente Exemplo',
      videoTitle: 'Vídeo Exemplo',
      buildings: ['Prédio A', 'Prédio B'],
      startDate: '01/01/2025',
      endDate: '31/01/2025',
      orderId: 'PED-123'
    }
  },
  {
    id: 'video_rejected',
    name: 'Vídeo Rejeitado',
    renderFunction: EmailTemplates.createVideoRejectedEmail,
    sampleData: {
      userEmail: 'cliente@exemplo.com',
      userName: 'Cliente Exemplo',
      videoTitle: 'Vídeo Exemplo',
      rejectionReason: 'Qualidade não atende aos requisitos',
      orderId: 'PED-123'
    }
  },
  {
    id: 'benefit_invitation',
    name: 'Convite Presente',
    renderFunction: EmailTemplates.createBenefitInvitationEmail,
    sampleData: {
      providerEmail: 'prestador@exemplo.com',
      providerName: 'Prestador Exemplo',
      buildingName: 'Edifício Central',
      activationCount: 3,
      eligibilityUrl: 'https://www.examidia.com.br/beneficios'
    }
  },
  {
    id: 'benefit_code',
    name: 'Código do Presente',
    renderFunction: EmailTemplates.createBenefitGiftCodeEmail,
    sampleData: {
      providerEmail: 'prestador@exemplo.com',
      providerName: 'Prestador Exemplo',
      giftName: 'Gift Card Amazon',
      giftCode: 'ABC123XYZ',
      giftLink: 'https://amazon.com.br/redeem',
      instructions: 'Acesse o link e insira o código'
    }
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 [SYNC_TEMPLATES] Iniciando sincronização de templates...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    // Processar cada template
    for (const template of templates) {
      try {
        console.log(`📧 [SYNC_TEMPLATES] Processando: ${template.name}`);
        
        // Renderizar o template
        const html = template.renderFunction(template.sampleData);
        
        // Salvar/atualizar no banco
        const { error: upsertError } = await supabase
          .from('email_templates_cache')
          .upsert({
            template_id: template.id,
            template_name: template.name,
            html_content: html,
            last_updated: new Date().toISOString(),
            version: new Date().getTime().toString()
          }, {
            onConflict: 'template_id'
          });

        if (upsertError) {
          console.error(`❌ [SYNC_TEMPLATES] Erro ao salvar ${template.name}:`, upsertError);
          errorCount++;
          results.push({
            templateId: template.id,
            templateName: template.name,
            status: 'error',
            error: upsertError.message
          });
        } else {
          console.log(`✅ [SYNC_TEMPLATES] ${template.name} sincronizado`);
          successCount++;
          results.push({
            templateId: template.id,
            templateName: template.name,
            status: 'success'
          });
        }

        // Pequeno delay para evitar sobrecarga
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error: any) {
        console.error(`💥 [SYNC_TEMPLATES] Erro crítico em ${template.name}:`, error);
        errorCount++;
        results.push({
          templateId: template.id,
          templateName: template.name,
          status: 'error',
          error: error.message
        });
      }
    }

    console.log(`🎉 [SYNC_TEMPLATES] Sincronização concluída: ${successCount} sucesso, ${errorCount} erros`);

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          total: templates.length,
          success: successCount,
          errors: errorCount
        },
        results,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('💥 [SYNC_TEMPLATES] Erro crítico:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
