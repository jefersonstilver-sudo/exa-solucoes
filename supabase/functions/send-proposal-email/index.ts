import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Logo oficial EXA - URL pública do Supabase Storage
const EXA_LOGO_URL = 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/email-assets/exa-logo.png';

// Cores oficiais
const EXA_COLORS = {
  primary: '#8B1A1A',
  primaryDark: '#6B1414',
  text: '#333333',
  textLight: '#666666',
};

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

    // Build HTML email using corporate template
    // Forces light mode on all clients (including iPhone dark mode)
    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light only">
  <title>Proposta Comercial - EXA Mídia</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Force light mode on all email clients */
    :root { color-scheme: light only; }
    
    /* Dark mode overrides - force white backgrounds */
    @media (prefers-color-scheme: dark) {
      body, .email-body, .email-wrapper, .email-container, .content-section {
        background-color: #ffffff !important;
        background: #ffffff !important;
        color: #333333 !important;
      }
      h1, h2, h3, p, span, td, th, div {
        color: #333333 !important;
      }
      .header-section {
        background-color: #8B1A1A !important;
      }
      .header-section h1, .header-section p {
        color: #ffffff !important;
      }
    }
    
    /* Apple Mail dark mode fix */
    [data-ogsc] body,
    [data-ogsc] .email-wrapper,
    [data-ogsc] .email-container {
      background-color: #ffffff !important;
      color: #333333 !important;
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f5 !important; -webkit-font-smoothing: antialiased;" class="email-body">
  
  <div class="email-wrapper" style="width: 100%; background-color: #f5f5f5 !important; padding: 40px 20px;">
    <div class="email-container" style="max-width: 520px; margin: 0 auto; background-color: #ffffff !important; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);">
      
      <!-- Header com gradiente EXA -->
      <div class="header-section" style="background: linear-gradient(135deg, ${EXA_COLORS.primary} 0%, ${EXA_COLORS.primaryDark} 100%); padding: 48px 32px; text-align: center;">
        <img 
          src="${EXA_LOGO_URL}" 
          alt="EXA Mídia" 
          style="height: 56px; width: auto; display: block; margin: 0 auto 20px auto;"
        />
        <h1 style="color: #ffffff !important; font-size: 22px; font-weight: 700; margin: 0; letter-spacing: -0.3px;">
          Nova Proposta Comercial
        </h1>
      </div>
      
      <!-- Content -->
      <div class="content-section" style="padding: 40px 32px; background-color: #ffffff !important;">
        
        <h2 style="color: ${EXA_COLORS.text} !important; font-size: 20px; font-weight: 600; text-align: center; margin: 0 0 20px;">
          Olá, ${clientFirstName}! 👋
        </h2>
        
        <p style="color: ${EXA_COLORS.textLight} !important; font-size: 15px; text-align: center; line-height: 1.7; margin: 0 0 32px;">
          Você recebeu uma proposta comercial da <strong style="color: ${EXA_COLORS.text};">EXA Mídia</strong>. 
          Clique no botão abaixo para visualizar todos os detalhes.
        </p>
        
        <!-- CTA Button -->
        <div style="text-align: center; margin: 32px 0;">
          <a 
            href="${proposalLink}" 
            style="display: inline-block; background: linear-gradient(135deg, ${EXA_COLORS.primary} 0%, ${EXA_COLORS.primaryDark} 100%); color: #ffffff !important; padding: 16px 48px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 16px rgba(139, 26, 26, 0.3);"
          >
            Ver Proposta
          </a>
        </div>
        
        <!-- Info box -->
        <div style="background-color: #f8f9fa; border-left: 4px solid ${EXA_COLORS.primary}; border-radius: 8px; padding: 16px 20px; margin: 24px 0;">
          <p style="color: ${EXA_COLORS.textLight} !important; font-size: 14px; margin: 0; line-height: 1.6;">
            📅 Esta proposta tem <strong style="color: ${EXA_COLORS.text};">validade de 24 horas</strong>. 
            Não perca a oportunidade!
          </p>
        </div>
        
      </div>
      
      <!-- Footer -->
      <div style="background-color: #fafafa; padding: 28px 32px; text-align: center; border-top: 1px solid #e5e5e5;">
        <p style="color: ${EXA_COLORS.primary}; font-size: 14px; font-weight: 700; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 0.5px;">
          ${sellerName}
        </p>
        <p style="color: #999999; font-size: 13px; margin: 0 0 16px;">
          EXA Mídia Digital
        </p>
        <p style="color: #bbbbbb; font-size: 12px; margin: 0;">
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
      subject: `📄 Proposta ${proposal.number} - EXA Mídia Digital`,
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
