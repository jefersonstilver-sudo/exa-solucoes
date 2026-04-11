import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { type, lead, data } = await req.json();

    console.log(`[NOTIFY-EXA-ALERT] Processing ${type} alert`);

    const MANYCHAT_API_KEY = Deno.env.get('MANYCHAT_API_KEY');

    // Buscar destinatários (diretores do EXA Alerts)
    const { data: directors } = await supabase
      .from('exa_alerts_directors')
      .select('telefone, nome')
      .eq('ativo', true);

    console.log(`[NOTIFY-EXA-ALERT] Found ${directors?.length || 0} directors`);

    const recipients = (directors || []).map(d => ({
      whatsapp_number: d.telefone,
      nome: d.nome
    }));

    // Montar mensagem baseada no tipo
    let message = '';
    
    if (type === 'hot_lead') {
      message = `🔥🔥🔥 ALERTA: LEAD MUITO QUENTE DETECTADO\n\n`;
      message += `📊 Score: ${lead.score}\n`;
      message += `👤 Contato: ${lead.contact_name || lead.contact_number}\n`;
      message += `📱 ${lead.contact_number}\n`;
      message += `\nEduardo foi notificado para ação imediata.`;
    } else if (type === 'risk_of_loss') {
      message = `⚠️⚠️⚠️ ALERTA CRÍTICO: RISCO DE PERDA DE LEAD\n\n`;
      message += `👤 Lead: ${lead.contact_name || lead.contact_number}\n`;
      message += `📊 Score: ${lead.score}\n`;
      message += `💰 Perfil: ${lead.profile_type}\n`;
      message += `\n⚠️ MOTIVO:\n${lead.reason_for_risk}\n`;
      message += `\n🎯 AÇÃO: Eduardo entrará em contato com condição especial.\n`;
      message += `\nEste lead requer atenção IMEDIATA da diretoria.`;
    } else if (type === 'cortesia_aceita') {
      message = `🎁 *CORTESIA ACEITA!*\n\n`;
      message += `📋 Proposta: #${data.proposal_number}\n`;
      message += `👤 Cliente: ${data.client_name}\n`;
      message += `📧 Email: ${data.client_email}\n`;
      message += `🏢 Prédios: ${data.buildings_count}\n`;
      message += `📅 Duração: ${data.duration_months} ${data.duration_months === 1 ? 'mês' : 'meses'}\n`;
      message += `📦 Pedido: ${data.pedido_id?.slice(0, 8)}...\n`;
      message += `👔 Vendedor: ${data.vendedor}\n`;
      message += `${data.is_new_user ? '🆕 Nova conta criada!' : '👤 Usuário existente'}`;
    } else if (type === 'contract_created') {
      message = `📄 *CONTRATO CRIADO!*\n\n`;
      message += `📋 Proposta: #${data.proposal_number}\n`;
      message += `📝 Contrato: ${data.contract_number}\n`;
      message += `👤 Cliente: ${lead.name}\n`;
      if (data.client_company) message += `🏢 Empresa: ${data.client_company}\n`;
      message += `💰 Valor: R$ ${(data.valor_total || 0).toLocaleString('pt-BR')}\n`;
      message += `\n✅ O contrato está aguardando assinatura do cliente.`;
      
      // Para contract_created, buscar destinatários específicos da proposta
      if (data.proposal_id) {
        const proposalRecipients = await getProposalRecipients(supabase, data.proposal_id, data.seller_id);
        if (proposalRecipients.length > 0) {
          // Substituir os recipients padrão pelos específicos da proposta
          recipients.length = 0;
          proposalRecipients.forEach(r => recipients.push(r));
        }
      }
    } else {
      message = `🔔 Notificação EXA Alert\n\n${JSON.stringify(data || lead, null, 2)}`;
    }

    // Enviar para cada diretor
    if (MANYCHAT_API_KEY && recipients.length > 0) {
      for (const director of recipients) {
        try {
          const personalizedMessage = `Olá ${director.nome},\n\n${message}`;
          
          const response = await fetch('https://api.manychat.com/fb/sending/sendContent', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${MANYCHAT_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              phone: director.whatsapp_number,
              data: {
                version: 'v2',
                content: {
                  messages: [{
                    type: 'text',
                    text: personalizedMessage
                  }]
                }
              }
            })
          });

          if (!response.ok) {
            console.error(`[NOTIFY-EXA-ALERT] Failed to send to ${director.nome}`);
          } else {
            console.log(`[NOTIFY-EXA-ALERT] Sent to ${director.nome}`);
          }
        } catch (error) {
          console.error(`[NOTIFY-EXA-ALERT] Error sending to ${director.nome}:`, error);
        }
      }
    }

    // Log
    await supabase.from('agent_logs').insert({
      agent_key: 'exa_alert',
      event_type: 'alert_sent',
      metadata: {
        type,
        lead,
        recipients: recipients.length,
        sent_at: new Date().toISOString(),
        via_manychat: !!MANYCHAT_API_KEY
      }
    });

    return new Response(JSON.stringify({ 
      success: true, 
      recipients: recipients.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[NOTIFY-EXA-ALERT] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Buscar destinatários específicos de uma proposta
async function getProposalRecipients(supabase: any, proposalId: string, sellerId?: string) {
  const recipients: { whatsapp_number: string; nome: string }[] = [];

  // 1. Vendedor que criou a proposta
  if (sellerId) {
    const { data: seller } = await supabase
      .from("users")
      .select("nome, telefone")
      .eq("id", sellerId)
      .single();

    if (seller?.telefone) {
      recipients.push({ whatsapp_number: seller.telefone, nome: seller.nome || "Vendedor" });
    }
  }

  // 2. Destinatários extras da proposta
  const { data: extraRecipients } = await supabase
    .from("proposal_alert_recipients")
    .select("name, phone, active, receive_whatsapp")
    .eq("proposal_id", proposalId)
    .eq("active", true)
    .eq("receive_whatsapp", true);

  if (extraRecipients) {
    for (const r of extraRecipients) {
      if (r.phone && !recipients.some(existing => existing.whatsapp_number === r.phone)) {
        recipients.push({ whatsapp_number: r.phone, nome: r.name || "Destinatário" });
      }
    }
  }

  return recipients;
}
