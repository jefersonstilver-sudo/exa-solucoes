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
    if (conversationId) {
      console.log('[NOTIFY-ESCALATION] 🔍 Fetching fresh data from database...');
      
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
      }
      
      // Buscar últimas 15 mensagens
      const { data: messagesData, error: msgError } = await supabase
        .from('messages')
        .select('body, direction, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(15);
      
      if (messagesData && messagesData.length > 0 && !msgError) {
        const sortedMessages = messagesData.reverse();
        
        const firstInbound = sortedMessages.find((m: any) => m.direction === 'inbound');
        if (firstInbound) {
          const date = new Date(firstInbound.created_at);
          const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
          const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          firstMessage = `[${dateStr} às ${timeStr}]\n${firstInbound.body}`;
        }
        
        conversationSummary = sortedMessages.map((m: any) => {
          const role = m.direction === 'inbound' ? '👤 Cliente' : '🤖 Sofia';
          let text = (m.body || '[mídia]').replace(/\s*\[ESCALAR:[^\]]*\]\s*/g, '');
          text = text.substring(0, 150);
          
          const date = new Date(m.created_at);
          const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
          const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          return `[${dateStr} ${timeStr}] ${role}: ${text}`;
        }).join('\n');
      }
    }

    // 1. Salvar escalação no banco
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
    const { data: vendedores, error: vendedoresError } = await supabase
      .from('escalacao_vendedores')
      .select('*')
      .eq('ativo', true)
      .eq('recebe_escalacoes', true);

    console.log('[NOTIFY-ESCALATION] 📋 Vendedores found:', vendedores?.length || 0);

    if (!vendedores || vendedores.length === 0) {
      console.log('[NOTIFY-ESCALATION] ⚠️ No active sellers to notify');
      return new Response(JSON.stringify({ 
        success: true, 
        escalacaoId: escalacao.id,
        notified: 0,
        reason: 'no_active_sellers'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 3. Buscar configuração Z-API
    const { data: agent } = await supabase
      .from('agents')
      .select('zapi_config')
      .eq('key', 'sofia')
      .single();

    const zapiConfig = agent?.zapi_config as { instance_id?: string; token?: string } | null;
    const zapiClientToken = Deno.env.get('ZAPI_CLIENT_TOKEN');

    if (!zapiConfig?.instance_id || !zapiConfig?.token || !zapiClientToken) {
      console.log('[NOTIFY-ESCALATION] ⚠️ Z-API not configured');
      return new Response(JSON.stringify({ 
        success: true, 
        escalacaoId: escalacao.id,
        notified: 0,
        reason: 'zapi_not_configured'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 4. Montar mensagem
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
    const cleanPhoneForLink = phoneNumber.replace(/\D/g, '');

    let message = `🔔 *ESCALAÇÃO COMERCIAL*\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `📅 *Data/Hora:* ${dateStr} às ${timeStr}\n\n`;
    message += `👤 *Lead:* ${leadName || 'Não identificado'}\n`;
    message += `📱 *Telefone:* ${formatPhoneDisplay(phoneNumber)}\n`;
    message += `📲 *WhatsApp:* https://wa.me/${cleanPhoneForLink}\n`;
    
    if (leadSegment) message += `🏢 *Segmento:* ${leadSegment}\n`;
    if (leadInterest) message += `💡 *Interesse:* ${leadInterest}\n`;
    if (plansInterested?.length > 0) message += `📊 *Planos:* ${plansInterested.join(', ')}\n`;

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

    // 5. NOVA ESTRATÉGIA: TEXTO PRIMEIRO (garantido) + BOTÕES DEPOIS (opcional)
    let notifiedCount = 0;
    const textUrl = `https://api.z-api.io/instances/${zapiConfig.instance_id}/token/${zapiConfig.token}/send-text`;
    const buttonUrl = `https://api.z-api.io/instances/${zapiConfig.instance_id}/token/${zapiConfig.token}/send-button-actions`;
    
    for (const vendedor of vendedores) {
      try {
        const vendedorPhone = vendedor.telefone.startsWith('55') 
          ? vendedor.telefone 
          : `55${vendedor.telefone}`;

        // ✅ PASSO 1: SEMPRE enviar TEXTO PRIMEIRO (100% garantido funcionar)
        const fullTextMessage = `Olá ${vendedor.nome}!\n\n${message}\n\n📌 *RESPONDA:*\n• "OK" ou "ATENDI" = Já respondi ao lead\n• "DEPOIS" = Vou responder depois`;
        
        console.log(`[NOTIFY-ESCALATION] 📤 Sending TEXT to ${vendedor.nome}...`);
        
        const textResponse = await fetch(textUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Client-Token': zapiClientToken
          },
          body: JSON.stringify({
            phone: vendedorPhone,
            message: fullTextMessage
          })
        });

        const textResult = await textResponse.text();
        console.log(`[NOTIFY-ESCALATION] 📥 Text response for ${vendedor.nome}:`, {
          status: textResponse.status,
          ok: textResponse.ok,
          body: textResult.substring(0, 200)
        });

        if (textResponse.ok) {
          notifiedCount++;
          console.log(`[NOTIFY-ESCALATION] ✅ TEXT sent successfully to ${vendedor.nome}`);
          
          // ✅ PASSO 2: TENTAR enviar BOTÕES como mensagem SEPARADA (pode falhar, tudo bem)
          try {
            const buttonJaRespondi = `escalacao_respondida_${escalacao.id}`;
            const buttonVouResponder = `escalacao_depois_${escalacao.id}`;
            
            console.log(`[NOTIFY-ESCALATION] 🔘 Attempting BUTTONS for ${vendedor.nome}...`);
            
            const buttonResponse = await fetch(buttonUrl, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Client-Token': zapiClientToken
              },
              body: JSON.stringify({
                phone: vendedorPhone,
                message: "👆 Ou clique em um botão:",
                buttonActions: [
                  { id: buttonJaRespondi, label: "✅ Já respondi" },
                  { id: buttonVouResponder, label: "⏰ Vou responder depois" }
                ]
              })
            });

            if (buttonResponse.ok) {
              console.log(`[NOTIFY-ESCALATION] ✅ BUTTONS also sent to ${vendedor.nome} (bonus!)`);
            } else {
              console.log(`[NOTIFY-ESCALATION] ⚠️ Buttons failed for ${vendedor.nome}, but text was already sent`);
            }
          } catch (buttonError) {
            console.log(`[NOTIFY-ESCALATION] ⚠️ Button attempt failed for ${vendedor.nome}, text was sent:`, buttonError);
          }
        } else {
          console.error(`[NOTIFY-ESCALATION] ❌ Failed to send text to ${vendedor.nome}:`, textResult);
        }
      } catch (error) {
        console.error(`[NOTIFY-ESCALATION] ❌ Error sending to ${vendedor.nome}:`, error);
      }
    }

    // 6. Log
    await supabase.from('agent_logs').insert({
      agent_key: 'sofia',
      conversation_id: conversationId,
      event_type: 'escalation_sent',
      metadata: {
        escalacao_id: escalacao.id,
        lead_phone: phoneNumber,
        lead_name: leadName,
        notified_sellers: notifiedCount,
        strategy: 'text_first_buttons_optional',
        sent_at: new Date().toISOString()
      }
    });

    console.log('[NOTIFY-ESCALATION] ✅ Complete:', {
      escalacaoId: escalacao.id,
      notified: notifiedCount,
      strategy: 'text_first_buttons_optional'
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
