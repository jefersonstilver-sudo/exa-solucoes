import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
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

    const { 
      conversationId, 
      phoneNumber, 
      leadName,
      leadSegment,
      leadInterest,
      plansInterested,
      firstMessage,
      conversationSummary,
      aiAnalysis
    } = await req.json();

    console.log('[NOTIFY-ESCALATION] 🚀 Processing escalation:', {
      conversationId,
      phoneNumber,
      leadName,
      timestamp: new Date().toISOString()
    });

    // 1. Salvar escalação no banco
    const { data: escalacao, error: insertError } = await supabase
      .from('escalacoes_comerciais')
      .insert({
        conversation_id: conversationId,
        phone_number: phoneNumber,
        lead_name: leadName,
        lead_segment: leadSegment,
        lead_interest: leadInterest,
        plans_interested: plansInterested,
        first_message: firstMessage,
        conversation_summary: conversationSummary,
        ai_analysis: aiAnalysis,
        status: 'pendente',
        assigned_to: 'eduardo'
      })
      .select()
      .single();

    if (insertError) {
      console.error('[NOTIFY-ESCALATION] ❌ Error inserting escalation:', insertError);
      throw insertError;
    }

    console.log('[NOTIFY-ESCALATION] ✅ Escalation saved:', escalacao.id);

    // 2. Buscar vendedores ativos que recebem escalações
    const { data: vendedores } = await supabase
      .from('escalacao_vendedores')
      .select('*')
      .eq('ativo', true)
      .eq('recebe_escalacoes', true);

    if (!vendedores || vendedores.length === 0) {
      console.log('[NOTIFY-ESCALATION] ⚠️ No active sellers to notify');
      return new Response(JSON.stringify({ 
        success: true, 
        escalacaoId: escalacao.id,
        notified: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 3. Buscar configuração Z-API para enviar mensagem
    const { data: agent } = await supabase
      .from('agents')
      .select('zapi_config')
      .eq('key', 'sofia')
      .single();

    const zapiConfig = agent?.zapi_config as { instance_id?: string; token?: string } | null;
    
    console.log('[NOTIFY-ESCALATION] 🔧 Z-API config check:', {
      hasConfig: !!zapiConfig,
      hasInstanceId: !!zapiConfig?.instance_id,
      hasToken: !!zapiConfig?.token
    });

    if (!zapiConfig?.instance_id || !zapiConfig?.token) {
      console.log('[NOTIFY-ESCALATION] ⚠️ Z-API not configured - missing instance_id or token');
      return new Response(JSON.stringify({ 
        success: true, 
        escalacaoId: escalacao.id,
        notified: 0,
        reason: 'zapi_not_configured'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 4. Montar mensagem para Eduardo
    const formatPhoneDisplay = (phone: string) => {
      const clean = phone.replace(/\D/g, '');
      if (clean.length === 13) {
        return `+${clean.slice(0, 2)} (${clean.slice(2, 4)}) ${clean.slice(4, 9)}-${clean.slice(9)}`;
      }
      return phone;
    };

    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR');
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    let message = `🔔 *ESCALAÇÃO COMERCIAL*\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `📅 *Data/Hora:* ${dateStr} às ${timeStr}\n\n`;
    message += `👤 *Lead:* ${leadName || 'Não identificado'}\n`;
    message += `📱 *Telefone:* ${formatPhoneDisplay(phoneNumber)}\n`;
    
    if (leadSegment) {
      message += `🏢 *Segmento:* ${leadSegment}\n`;
    }
    
    if (leadInterest) {
      message += `💡 *Interesse:* ${leadInterest}\n`;
    }
    
    if (plansInterested && plansInterested.length > 0) {
      message += `📊 *Planos:* ${plansInterested.join(', ')}\n`;
    }

    message += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    
    if (firstMessage) {
      message += `\n💬 *Primeira mensagem:*\n"${firstMessage.substring(0, 200)}${firstMessage.length > 200 ? '...' : ''}"\n`;
    }

    if (conversationSummary) {
      message += `\n📝 *Resumo da conversa:*\n${conversationSummary}\n`;
    }

    if (aiAnalysis) {
      message += `\n🤖 *Análise Sofia:*\n${aiAnalysis}\n`;
    }

    message += `\n━━━━━━━━━━━━━━━━━━━━`;
    message += `\n⚡ Cliente solicitou condição especial`;
    message += `\n💼 Aguardando seu contato!`;

    // 5. Enviar mensagem para cada vendedor
    let notifiedCount = 0;
    
    for (const vendedor of vendedores) {
      try {
        const vendedorPhone = vendedor.telefone.startsWith('55') 
          ? vendedor.telefone 
          : `55${vendedor.telefone}`;

        console.log(`[NOTIFY-ESCALATION] 📤 Sending to ${vendedor.nome} at ${vendedorPhone}`);
        
        const zapiUrl = `https://api.z-api.io/instances/${zapiConfig.instance_id}/token/${zapiConfig.token}/send-text`;
        
        const response = await fetch(zapiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone: vendedorPhone,
              message: `Olá ${vendedor.nome}!\n\n${message}`
            })
          }
        );

        if (response.ok) {
          console.log(`[NOTIFY-ESCALATION] ✅ Sent to ${vendedor.nome}`);
          notifiedCount++;
        } else {
          const errorText = await response.text();
          console.error(`[NOTIFY-ESCALATION] ❌ Failed to send to ${vendedor.nome}:`, errorText);
        }
      } catch (error) {
        console.error(`[NOTIFY-ESCALATION] ❌ Error sending to ${vendedor.nome}:`, error);
      }
    }

    // 6. Log da escalação
    await supabase.from('agent_logs').insert({
      agent_key: 'sofia',
      conversation_id: conversationId,
      event_type: 'escalation_sent',
      metadata: {
        escalacao_id: escalacao.id,
        lead_phone: phoneNumber,
        lead_name: leadName,
        notified_sellers: notifiedCount,
        sent_at: new Date().toISOString()
      }
    });

    console.log('[NOTIFY-ESCALATION] ✅ Complete:', {
      escalacaoId: escalacao.id,
      notified: notifiedCount
    });

    return new Response(JSON.stringify({ 
      success: true, 
      escalacaoId: escalacao.id,
      notified: notifiedCount 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[NOTIFY-ESCALATION] ❌ Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});