import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

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

    if (!proposal.client_phone) {
      return new Response(
        JSON.stringify({ error: 'Cliente não possui telefone cadastrado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean phone number
    const cleanPhone = proposal.client_phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

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

    // Build proposal link - usar domínio Lovable (funciona!)
    const proposalLink = `https://64f6806c-c0e0-422b-b85f-955fd5719544.lovableproject.com/propostacomercial/${proposal.id}`;

    // Format expiration date
    const expiresAt = proposal.expires_at 
      ? new Date(proposal.expires_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
      : '24 horas';

    // Get seller name and phone (fetch from users table if created_by exists)
    let sellerName = 'Equipe EXA Mídia';
    let sellerPhone = '';
    if (proposal.created_by) {
      const { data: userData } = await supabase
        .from('users')
        .select('nome, telefone')
        .eq('id', proposal.created_by)
        .single();
      
      if (userData?.nome) {
        sellerName = userData.nome;
      }
      if (userData?.telefone) {
        sellerPhone = userData.telefone;
      }
    }

    // Build WhatsApp message - UMA ÚNICA mensagem profissional e curta
    const message = `🎯 *PROPOSTA COMERCIAL — EXA MÍDIA*

Olá *${proposal.client_name?.split(' ')[0] || 'Cliente'}*!

Você recebeu uma proposta comercial.

📋 *${proposal.number}*

👉 *Ver proposta:*
${proposalLink}

_Válida até ${expiresAt}_

${sellerName}
EXA Mídia`;

    // Get Z-API config from agents table (using EXA Alert agent for proposals)
    console.log('[SEND-PROPOSAL-WHATSAPP] Usando agente: EXA Alert para envio de propostas');
    
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('zapi_config')
      .eq('key', 'exa_alert')
      .single();

    if (agentError || !agent?.zapi_config) {
      console.error('Erro ao buscar configuração Z-API do EXA Alert:', agentError);
      return new Response(
        JSON.stringify({ error: 'Z-API não configurado no agente EXA Alert' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const zapiConfig = agent.zapi_config as { instance_id?: string; token?: string; client_token?: string };
    const zapiInstanceId = zapiConfig.instance_id;
    const zapiToken = zapiConfig.token;
    const zapiClientToken = zapiConfig.client_token || Deno.env.get('ZAPI_CLIENT_TOKEN') || '';

    if (!zapiInstanceId || !zapiToken) {
      console.error('Z-API credentials não encontradas no agente EXA Alert');
      return new Response(
        JSON.stringify({ error: 'Z-API não configurado corretamente no EXA Alert' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const zapiUrl = `https://api.z-api.io/instances/${zapiInstanceId}/token/${zapiToken}/send-text`;
    
    // Enviar UMA ÚNICA mensagem
    const zapiResponse = await fetch(zapiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Token': zapiClientToken || '',
      },
      body: JSON.stringify({
        phone: formattedPhone,
        message: message,
      }),
    });

    const zapiResult = await zapiResponse.json();

    if (!zapiResponse.ok) {
      console.error('Erro Z-API:', zapiResult);
      throw new Error(zapiResult.message || 'Erro ao enviar WhatsApp');
    }

    console.log('[SEND-PROPOSAL-WHATSAPP] Mensagem única enviada:', zapiResult);

    // Log the action
    await supabase.from('proposal_logs').insert({
      proposal_id: proposalId,
      action: 'enviada_whatsapp',
      details: {
        phone: formattedPhone,
        zapi_response: zapiResult,
        seller_phone: sellerPhone || null,
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
        message: 'Proposta enviada via WhatsApp',
        zapiResult 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro no send-proposal-whatsapp:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
