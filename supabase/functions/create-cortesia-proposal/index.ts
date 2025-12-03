import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { requestId, requestData, createdBy } = await req.json();

    console.log('[create-cortesia-proposal] Criando PROPOSTA de cortesia:', { requestId, requestData });

    if (!requestId || !requestData) {
      return new Response(JSON.stringify({ error: 'Dados obrigatórios não fornecidos' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      client_name,
      client_email,
      client_phone,
      client_cnpj,
      buildings,
      duration_months,
      total_panels
    } = requestData;

    // Gerar número da proposta
    const year = new Date().getFullYear();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const proposalNumber = `CORT-${year}-${randomNum}`;

    // Calcular total de telas e impressões
    const totalPanels = total_panels || buildings?.reduce((sum: number, b: any) => 
      sum + (b.quantidade_telas || 1), 0) || 0;
    
    const totalImpressions = buildings?.reduce((sum: number, b: any) => 
      sum + (b.visualizacoes_mes || 0), 0) || 0;

    // Criar PROPOSTA (não pedido!) com tipo cortesia
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .insert({
        number: proposalNumber,
        client_name,
        client_email,
        client_phone,
        client_cnpj,
        selected_buildings: buildings,
        total_panels: totalPanels,
        total_impressions_month: totalImpressions,
        fidel_monthly_value: 0, // GRÁTIS!
        cash_total_value: 0,    // GRÁTIS!
        discount_percent: 100,   // 100% de desconto
        duration_months,
        status: 'enviada',
        sent_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias
        created_by: createdBy,
        metadata: {
          type: 'cortesia',
          cortesia_code_id: requestId
        }
      })
      .select()
      .single();

    if (proposalError) {
      console.error('[create-cortesia-proposal] Erro ao criar proposta:', proposalError);
      throw proposalError;
    }

    console.log('[create-cortesia-proposal] Proposta criada:', proposal.id, proposal.number);

    // Log da criação
    await supabase.from('proposal_logs').insert({
      proposal_id: proposal.id,
      action: 'criada',
      details: {
        type: 'cortesia',
        cortesia_code_id: requestId,
        buildings_count: buildings?.length || 0
      }
    });

    // Enviar WhatsApp para o cliente se tiver telefone
    if (client_phone) {
      try {
        // Buscar config do agente exa_alert para enviar WhatsApp
        const { data: agent } = await supabase
          .from('agents')
          .select('zapi_config')
          .eq('key', 'exa_alert')
          .single();

        if (agent?.zapi_config) {
          const zapiConfig = agent.zapi_config as any;
          const zapiInstanceId = zapiConfig.instance_id;
          const zapiToken = zapiConfig.token;
          const zapiClientToken = Deno.env.get('ZAPI_CLIENT_TOKEN');

          // Formatar telefone
          const cleanPhone = client_phone.replace(/\D/g, '');
          const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

          // Construir link da proposta
          const proposalLink = `https://64f6806c-c0e0-422b-b85f-955fd5719544.lovableproject.com/propostacomercial/${proposal.id}`;

          // Mensagem WhatsApp
          const message = `🎁 *VOCÊ GANHOU UM PRESENTE!*

Olá ${client_name}! 👋

A *EXA Mídia* tem uma surpresa especial para você!

🏢 *${buildings?.length || 0} prédio(s)* com suas telas digitais
📺 *${totalPanels} tela(s)* de alta visibilidade  
📅 *${duration_months} ${duration_months === 1 ? 'mês' : 'meses'}* de campanha

💰 *100% GRÁTIS - CORTESIA ESPECIAL!*

👉 *Aceite seu presente:*
${proposalLink}

⚠️ _Válido por 7 dias_

Qualquer dúvida, estamos à disposição!`;

          // Enviar via Z-API
          const zapiUrl = `https://api.z-api.io/instances/${zapiInstanceId}/token/${zapiToken}/send-text`;
          
          const zapiResponse = await fetch(zapiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Client-Token': zapiClientToken || ''
            },
            body: JSON.stringify({
              phone: formattedPhone,
              message
            })
          });

          const zapiResult = await zapiResponse.json();
          console.log('[create-cortesia-proposal] WhatsApp enviado:', zapiResult);

          // Log do envio
          await supabase.from('proposal_logs').insert({
            proposal_id: proposal.id,
            action: 'whatsapp_enviado',
            details: { phone: formattedPhone, zapiResult }
          });
        }
      } catch (whatsappErr) {
        console.error('[create-cortesia-proposal] Erro ao enviar WhatsApp:', whatsappErr);
        // Não falhar se WhatsApp der erro
      }
    }

    // Log do evento no sistema
    await supabase.from('log_eventos_sistema').insert({
      tipo_evento: 'CORTESIA_PROPOSAL_CREATED',
      descricao: `Proposta de cortesia ${proposalNumber} criada para ${client_name}`
    });

    return new Response(JSON.stringify({
      success: true,
      proposal: {
        id: proposal.id,
        number: proposal.number
      },
      message: 'Proposta de cortesia enviada para o cliente!'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[create-cortesia-proposal] Erro:', error);
    return new Response(JSON.stringify({ error: error.message || 'Erro interno' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
