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

    let { 
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
      leadSegment,
      firstMessage: firstMessage?.substring(0, 50),
      timestamp: new Date().toISOString()
    });

    // ========== ENRIQUECIMENTO DE DADOS ==========
    // SEMPRE buscar dados FRESCOS do banco, ignorando o que foi passado
    if (conversationId) {
      console.log('[NOTIFY-ESCALATION] 🔍 ALWAYS fetching fresh data from database...');
      
      // Buscar dados da conversa
      const { data: conversationData, error: convError } = await supabase
        .from('conversations')
        .select('contact_name, contact_type')
        .eq('id', conversationId)
        .single();
      
      if (conversationData && !convError) {
        if (!leadName && conversationData.contact_name) {
          leadName = conversationData.contact_name;
          console.log('[NOTIFY-ESCALATION] ✅ Enriched leadName:', leadName);
        }
        if (!leadSegment && conversationData.contact_type) {
          leadSegment = conversationData.contact_type;
          console.log('[NOTIFY-ESCALATION] ✅ Enriched leadSegment:', leadSegment);
        }
      } else {
        console.log('[NOTIFY-ESCALATION] ⚠️ Could not fetch conversation data:', convError?.message);
      }
      
      // SEMPRE buscar últimas 15 mensagens FRESCAS - ignorando o que foi passado
      console.log('[NOTIFY-ESCALATION] 🔄 Fetching FRESH last 15 messages...');
      const { data: messagesData, error: msgError } = await supabase
        .from('messages')
        .select('body, direction, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false }) // DESC para pegar as mais recentes
        .limit(15);
      
      if (messagesData && messagesData.length > 0 && !msgError) {
        console.log('[NOTIFY-ESCALATION] 📨 Fetched', messagesData.length, 'fresh messages');
        
        // Reverter para ordem cronológica (mais antiga primeiro)
        const sortedMessages = messagesData.reverse();
        
        // Primeira mensagem do cliente (inbound) COM DATA/HORA
        const firstInbound = sortedMessages.find((m: any) => m.direction === 'inbound');
        if (firstInbound) {
          const date = new Date(firstInbound.created_at);
          const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
          const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          firstMessage = `[${dateStr} às ${timeStr}]\n${firstInbound.body}`;
          console.log('[NOTIFY-ESCALATION] ✅ First message with timestamp:', firstMessage?.substring(0, 80));
        }
        
        // SEMPRE gerar resumo fresco com timestamps
        conversationSummary = sortedMessages.map((m: any) => {
          const role = m.direction === 'inbound' ? '👤 Cliente' : '🤖 Sofia';
          // Remover tags de escalação da mensagem
          let text = (m.body || '[mídia]').replace(/\s*\[ESCALAR:[^\]]*\]\s*/g, '');
          text = text.substring(0, 150);
          
          const date = new Date(m.created_at);
          const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
          const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          return `[${dateStr} ${timeStr}] ${role}: ${text}`;
        }).join('\n');
        
        console.log('[NOTIFY-ESCALATION] ✅ Generated FRESH conversationSummary with', sortedMessages.length, 'messages');
        console.log('[NOTIFY-ESCALATION] 📝 Summary preview:', conversationSummary?.substring(0, 200));
      } else {
        console.log('[NOTIFY-ESCALATION] ⚠️ Could not fetch messages:', msgError?.message);
      }
    }

    console.log('[NOTIFY-ESCALATION] 📦 Final enriched data:', {
      hasLeadName: !!leadName,
      hasLeadSegment: !!leadSegment,
      hasFirstMessage: !!firstMessage,
      hasSummary: !!conversationSummary,
      summaryLength: conversationSummary?.length,
      summaryPreview: conversationSummary?.substring(0, 100)
    });

    // 1. Salvar escalação no banco com dados enriquecidos
    const { data: escalacao, error: insertError } = await supabase
      .from('escalacoes_comerciais')
      .insert({
        conversation_id: conversationId,
        phone_number: phoneNumber,
        lead_name: leadName || null,
        lead_segment: leadSegment || null,
        lead_interest: leadInterest || null,
        plans_interested: plansInterested || null,
        first_message: firstMessage || null,
        conversation_summary: conversationSummary || null,
        ai_analysis: aiAnalysis || null,
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
    console.log('[NOTIFY-ESCALATION] 🔍 Querying escalacao_vendedores...');
    const { data: vendedores, error: vendedoresError } = await supabase
      .from('escalacao_vendedores')
      .select('*')
      .eq('ativo', true)
      .eq('recebe_escalacoes', true);

    console.log('[NOTIFY-ESCALATION] 📋 Vendedores query result:', {
      error: vendedoresError?.message,
      count: vendedores?.length || 0,
      vendedores: vendedores?.map(v => ({ id: v.id, nome: v.nome, telefone: v.telefone, ativo: v.ativo, recebe: v.recebe_escalacoes }))
    });

    if (!vendedores || vendedores.length === 0) {
      console.log('[NOTIFY-ESCALATION] ⚠️ No active sellers to notify - check escalacao_vendedores table');
      return new Response(JSON.stringify({ 
        success: true, 
        escalacaoId: escalacao.id,
        notified: 0,
        reason: 'no_active_sellers'
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

        const zapiUrl = `https://api.z-api.io/instances/${zapiConfig.instance_id}/token/${zapiConfig.token}/send-text`;
        const fullMessage = `Olá ${vendedor.nome}!\n\n${message}`;
        
        console.log(`[NOTIFY-ESCALATION] 📤 Z-API Request Details:`, {
          url: zapiUrl.replace(zapiConfig.token!, '***TOKEN***'),
          vendedor: vendedor.nome,
          phone: vendedorPhone,
          messageLength: fullMessage.length,
          messagePreview: fullMessage.substring(0, 200)
        });
        
        const response = await fetch(zapiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: vendedorPhone,
            message: fullMessage
          })
        });

        const responseText = await response.text();
        console.log(`[NOTIFY-ESCALATION] 📥 Z-API Response:`, {
          vendedor: vendedor.nome,
          status: response.status,
          ok: response.ok,
          body: responseText.substring(0, 300)
        });

        if (response.ok) {
          console.log(`[NOTIFY-ESCALATION] ✅ Successfully sent to ${vendedor.nome}`);
          notifiedCount++;
        } else {
          console.error(`[NOTIFY-ESCALATION] ❌ Failed to send to ${vendedor.nome}: Status ${response.status}`, responseText);
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