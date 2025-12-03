import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Logo oficial EXA - URL pública do Supabase Storage
const EXA_LOGO_URL = 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/email-assets/exa-logo.png';

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { proposalId } = await req.json();

    if (!proposalId) {
      return new Response(
        JSON.stringify({ error: 'proposalId é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Initialize Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const resend = new Resend(resendApiKey);

    // Fetch proposal data
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', proposalId)
      .single();

    if (proposalError || !proposal) {
      console.error('Erro ao buscar proposta:', proposalError);
      return new Response(
        JSON.stringify({ error: 'Proposta não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!proposal.client_email) {
      return new Response(
        JSON.stringify({ error: 'Cliente não possui e-mail cadastrado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build proposal link
    const proposalLink = `https://examidia.com.br/propostacomercial/${proposal.id}`;

    // Get seller name
    let sellerName = 'Equipe EXA Mídia';
    if (proposal.created_by) {
      const { data: userData } = await supabase
        .from('users')
        .select('nome')
        .eq('id', proposal.created_by)
        .single();
      
      if (userData?.nome) {
        sellerName = userData.nome;
      }
    }

    // Get client first name
    const clientFirstName = proposal.client_name?.split(' ')[0] || 'Cliente';

    // Build HTML email - CORPORATE SOBER STYLE (white background, minimal colors)
    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light only">
  <title>Proposta Comercial - EXA Mídia</title>
  <style>
    :root { color-scheme: light only; }
    @media (prefers-color-scheme: dark) {
      body, .email-body, .email-wrapper, .email-container, .content-section {
        background-color: #ffffff !important;
        background: #ffffff !important;
        color: #333333 !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f5 !important; -webkit-font-smoothing: antialiased;" class="email-body">
  
  <div class="email-wrapper" style="width: 100%; background-color: #f5f5f5 !important; padding: 40px 20px;">
    <div class="email-container" style="max-width: 560px; margin: 0 auto; background-color: #ffffff !important; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);">
      
      <!-- Header - CLEAN WHITE with logo -->
      <div style="background-color: #ffffff; padding: 32px; text-align: center; border-bottom: 1px solid #f0f0f0;">
        <img 
          src="${EXA_LOGO_URL}" 
          alt="EXA Mídia" 
          style="height: 48px; width: auto; display: block; margin: 0 auto;"
        />
      </div>
      
      <!-- Content -->
      <div style="padding: 40px 32px; background-color: #ffffff !important;">
        
        <h1 style="color: #111827; font-size: 22px; font-weight: 600; text-align: center; margin: 0 0 8px;">
          Nova Proposta Comercial
        </h1>
        
        <p style="color: #6B7280; font-size: 14px; text-align: center; margin: 0 0 32px;">
          Proposta ${proposal.number}
        </p>
        
        <p style="color: #374151; font-size: 15px; text-align: center; line-height: 1.7; margin: 0 0 32px;">
          Olá, <strong>${clientFirstName}</strong>! 👋<br><br>
          Você recebeu uma proposta comercial da <strong>EXA Mídia</strong>.<br>
          Clique no botão abaixo para visualizar todos os detalhes.
        </p>
        
        <!-- CTA Button - Simple red -->
        <div style="text-align: center; margin: 32px 0;">
          <a 
            href="${proposalLink}" 
            style="display: inline-block; background-color: #8B1A1A; color: #ffffff !important; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;"
          >
            Ver Proposta
          </a>
        </div>
        
        <!-- Info box - minimal -->
        <div style="background-color: #f9fafb; border-left: 3px solid #8B1A1A; border-radius: 4px; padding: 14px 16px; margin: 24px 0;">
          <p style="color: #4B5563; font-size: 13px; margin: 0; line-height: 1.6;">
            ⏰ Esta proposta tem <strong>validade de 24 horas</strong>.<br>
            Não perca a oportunidade!
          </p>
        </div>
        
      </div>
      
      <!-- Footer - Clean -->
      <div style="background-color: #fafafa; padding: 24px 32px; text-align: center; border-top: 1px solid #f0f0f0;">
        <p style="color: #8B1A1A; font-size: 13px; font-weight: 600; margin: 0 0 4px;">
          ${sellerName}
        </p>
        <p style="color: #9CA3AF; font-size: 12px; margin: 0 0 16px;">
          EXA Mídia Digital
        </p>
        <p style="color: #D1D5DB; font-size: 11px; margin: 0;">
          © ${new Date().getFullYear()} EXA Mídia - Todos os direitos reservados
        </p>
      </div>
      
    </div>
  </div>
  
</body>
</html>
    `;

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: 'EXA Mídia <comercial@examidia.com.br>',
      to: [proposal.client_email],
      subject: `Proposta ${proposal.number} - EXA Mídia Digital`,
      html: htmlContent,
    });

    console.log('E-mail enviado com sucesso:', emailResponse);

    // Log the action
    await supabase.from('proposal_logs').insert({
      proposal_id: proposalId,
      action: 'enviada_email',
      details: {
        email: proposal.client_email,
        resend_response: emailResponse,
      },
    });

    // Update proposal sent_at if not already set
    if (!proposal.sent_at) {
      await supabase
        .from('proposals')
        .update({ sent_at: new Date().toISOString() })
        .eq('id', proposalId);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Proposta enviada via E-mail',
        emailResponse 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro no send-proposal-email:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
