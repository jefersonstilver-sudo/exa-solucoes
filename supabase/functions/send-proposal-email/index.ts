import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Build SIMPLE HTML email - NO prices, NO details, ONLY logo + link
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light only">
  <title>Proposta Comercial - EXA Mídia</title>
  <style>
    :root { color-scheme: light only; }
    @media (prefers-color-scheme: dark) {
      body, .email-body { background-color: #ffffff !important; color: #333333 !important; }
      .email-container { background-color: #ffffff !important; }
      h1, p, span { color: #333333 !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff !important;" class="email-body">
  <div style="max-width: 480px; margin: 0 auto; padding: 40px 24px;" class="email-container">
    
    <!-- Logo EXA -->
    <div style="text-align: center; margin-bottom: 32px;">
      <img 
        src="https://i.imgur.com/YJQwQvZ.png" 
        alt="EXA Mídia" 
        style="height: 48px; width: auto;"
      />
    </div>
    
    <!-- Greeting -->
    <h1 style="color: #1f2937; font-size: 22px; font-weight: 600; text-align: center; margin: 0 0 16px;">
      Olá, ${clientFirstName}!
    </h1>
    
    <p style="color: #6b7280; font-size: 15px; text-align: center; line-height: 1.6; margin: 0 0 32px;">
      Você recebeu uma proposta comercial da EXA Mídia. Clique no botão abaixo para visualizar todos os detalhes.
    </p>
    
    <!-- CTA Button -->
    <div style="text-align: center; margin: 32px 0;">
      <a 
        href="${proposalLink}" 
        style="display: inline-block; background-color: #9C1E1E; color: #ffffff; padding: 16px 48px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;"
      >
        Ver Proposta
      </a>
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
      <p style="color: #374151; font-size: 14px; font-weight: 500; margin: 0;">
        ${sellerName}
      </p>
      <p style="color: #9ca3af; font-size: 13px; margin: 4px 0 0;">
        EXA Mídia Digital
      </p>
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
