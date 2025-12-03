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

    // Get buildings count
    const buildingsCount = Array.isArray(proposal.selected_buildings) 
      ? proposal.selected_buildings.length 
      : 0;

    // Format currency values
    const formatCurrency = (value: number) => {
      return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    // Calculate total fidelity value
    const fidelTotal = proposal.fidel_monthly_value * proposal.duration_months;

    // Build proposal link - CORRETO: indexamidia.com.br
    const proposalLink = `https://www.indexamidia.com.br/propostacomercial/${proposal.id}`;
    
    // Format expiration date
    const expiresAt = proposal.expires_at 
      ? new Date(proposal.expires_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
      : '24 horas';

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

    // Build buildings list HTML
    const buildingsList = Array.isArray(proposal.selected_buildings)
      ? proposal.selected_buildings.map((b: any) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${b.building_name || 'N/A'}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${b.bairro || 'N/A'}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${b.quantidade_telas || 0}</td>
        </tr>
      `).join('')
      : '';

    // Build HTML email
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Proposta Comercial - EXA Mídia</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #9C1E1E 0%, #7D1818 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">🎯 Proposta Comercial</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 14px;">EXA Mídia Digital em Elevadores</p>
    </div>

    <!-- Content -->
    <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <p style="font-size: 16px; color: #374151;">Olá, <strong>${proposal.client_name?.split(' ')[0] || 'Cliente'}</strong>!</p>
      
      <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
        É com grande satisfação que apresentamos uma proposta personalizada para sua empresa anunciar nas telas digitais da EXA Mídia.
      </p>

      <!-- Proposal Summary -->
      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h2 style="margin: 0 0 15px; font-size: 16px; color: #374151;">📄 Proposta ${proposal.number}</h2>
        
        <div style="display: grid; gap: 10px;">
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
            <span style="color: #6b7280;">Prédios:</span>
            <strong style="color: #374151;">${buildingsCount} locais</strong>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
            <span style="color: #6b7280;">Telas:</span>
            <strong style="color: #374151;">${proposal.total_panels} painéis</strong>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
            <span style="color: #6b7280;">Impressões/mês:</span>
            <strong style="color: #374151;">${(proposal.total_impressions_month || 0).toLocaleString('pt-BR')}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
            <span style="color: #6b7280;">Período:</span>
            <strong style="color: #374151;">${proposal.duration_months} meses</strong>
          </div>
        </div>
      </div>

      <!-- Pricing -->
      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin: 0 0 15px; font-size: 14px; color: #92400e;">💰 Investimento</h3>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <span style="color: #78350f;">Mensal (Fidelidade):</span>
          <strong style="color: #78350f; font-size: 18px;">${formatCurrency(proposal.fidel_monthly_value)}/mês</strong>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <span style="color: #78350f;">Total (${proposal.duration_months}x):</span>
          <strong style="color: #78350f;">${formatCurrency(fidelTotal)}</strong>
        </div>

        <hr style="border: none; border-top: 1px dashed #d97706; margin: 15px 0;">
        
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #166534; font-weight: 600;">✨ À Vista (10% OFF):</span>
          <strong style="color: #166534; font-size: 20px;">${formatCurrency(proposal.cash_total_value)}</strong>
        </div>
      </div>

      <!-- Buildings Table -->
      ${buildingsCount > 0 ? `
      <div style="margin: 20px 0;">
        <h3 style="font-size: 14px; color: #374151; margin-bottom: 10px;">🏢 Locais Inclusos</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Prédio</th>
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Bairro</th>
              <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Telas</th>
            </tr>
          </thead>
          <tbody>
            ${buildingsList}
          </tbody>
        </table>
      </div>
      ` : ''}

      <!-- CTA Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${proposalLink}" 
           style="display: inline-block; background: linear-gradient(135deg, #9C1E1E 0%, #7D1818 100%); color: white; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
          📋 Ver Proposta Completa
        </a>
      </div>

      <p style="font-size: 12px; color: #9ca3af; text-align: center;">
        ⏰ Esta proposta é válida até ${expiresAt}
      </p>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

      <!-- Footer -->
      <div style="text-align: center;">
        <p style="font-size: 14px; color: #374151; margin: 0;">
          <strong>${sellerName}</strong>
        </p>
        <p style="font-size: 13px; color: #6b7280; margin: 5px 0;">
          EXA Mídia Digital
        </p>
        <p style="font-size: 12px; color: #9ca3af; margin: 10px 0 0;">
          Publicidade em Elevadores de Alto Padrão
        </p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: 'EXA Mídia <comercial@exa.digital>',
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
