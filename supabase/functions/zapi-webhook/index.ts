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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse webhook payload from Z-API
    const payload = await req.json();
    console.log('[ZAPI-WEBHOOK] Received:', JSON.stringify(payload, null, 2));

    // Z-API envia mensagens no formato:
    // { phone: "5545991415920", text: { message: "texto" }, instanceId: "..." }
    const phone = payload.phone || payload.remoteJid?.replace('@s.whatsapp.net', '');
    const messageText = payload.text?.message || payload.body || '';
    const instanceId = payload.instanceId;

    if (!phone || !messageText) {
      console.log('[ZAPI-WEBHOOK] Invalid payload, missing phone or message');
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Identificar qual agente recebeu a mensagem baseado no instanceId
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('whatsapp_provider', 'zapi')
      .eq('zapi_config->>instance_id', instanceId)
      .single();

    if (agentError || !agent) {
      console.error('[ZAPI-WEBHOOK] Agent not found for instance:', instanceId);
      return new Response(JSON.stringify({ error: 'Agent not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('[ZAPI-WEBHOOK] ✅ Agent found:', agent.key, '- Instance:', instanceId);

    // Log inbound message
    await supabase.from('zapi_logs').insert({
      agent_key: agent.key,
      direction: 'inbound',
      phone_number: phone,
      message_text: messageText,
      status: 'received',
      metadata: { raw_payload: payload }
    });

    // VALIDAÇÃO ESPECIAL PARA IRIS (somente diretores autorizados)
    if (agent.key === 'iris') {
      const { data: director } = await supabase
        .from('iris_authorized_directors')
        .select('*')
        .eq('phone_number', phone)
        .eq('is_active', true)
        .single();

      if (!director) {
        console.log('[ZAPI-WEBHOOK] IRIS: Unauthorized number:', phone);
        
        // Log tentativa de acesso não autorizado
        await supabase.from('agent_logs').insert({
          agent_key: 'iris',
          event_type: 'unauthorized_access_attempt',
          metadata: { phone, message: messageText }
        });

        // Enviar mensagem de rejeição educada
        const rejectMessage = `Olá! Este é um canal exclusivo da Diretoria INDEXA. 

Para suporte comercial, entre em contato com nossa equipe através do +55 45 99141-5920 (Sofia).

Obrigado pela compreensão!`;

        await supabase.functions.invoke('zapi-send-message', {
          body: {
            agentKey: 'iris',
            phone,
            message: rejectMessage
          }
        });

        return new Response(JSON.stringify({ 
          status: 'rejected',
          reason: 'unauthorized_number' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log('[ZAPI-WEBHOOK] IRIS: Authorized director:', director.director_name);
    }

    // BLOQUEIO PARA EXA ALERT (notification-only)
    if (agent.key === 'exa_alert') {
      console.log('[ZAPI-WEBHOOK] EXA Alert: ignoring inbound (notification-only)');
      return new Response(JSON.stringify({ 
        status: 'ignored',
        reason: 'notification_only_agent' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Criar/Atualizar conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .upsert({
        external_id: phone,
        contact_phone: phone,
        contact_name: payload.senderName || null,
        agent_key: agent.key,
        provider: 'zapi',
        status: 'open',
        last_message_at: new Date().toISOString()
      }, {
        onConflict: 'external_id,agent_key',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (convError) {
      console.error('[ZAPI-WEBHOOK] ❌ Conversation upsert error:', convError);
      throw new Error(`Failed to upsert conversation: ${convError.message}`);
    }

    if (!conversation) {
      console.error('[ZAPI-WEBHOOK] ❌ Conversation returned null without error');
      throw new Error('Conversation returned null');
    }

    console.log('[ZAPI-WEBHOOK] ✅ Conversation created/updated:', conversation.id);

    // Salvar mensagem
    const { data: savedMessage, error: messageError } = await supabase.from('messages').insert({
      conversation_id: conversation.id,
      agent_key: agent.key,
      provider: 'zapi',
      direction: 'inbound',
      from_role: 'user',
      body: messageText,
      raw_payload: payload
    }).select().single();

    if (messageError) {
      console.error('[ZAPI-WEBHOOK] ❌ Error saving message:', messageError);
      throw messageError;
    }

    console.log('[ZAPI-WEBHOOK] ✅ Message saved:', savedMessage.id);

    // Normalizar payload para formato interno do route-message
    const normalizedPayload = {
      message: messageText,
      conversationId: conversation.id,
      metadata: {
        source: 'zapi',
        agentKey: agent.key,
        phone,
        instanceId,
        timestamp: new Date().toISOString()
      }
    };

    // Chamar route-message para processar e responder
    console.log('[ZAPI-WEBHOOK] ✅ Calling route-message...');
    const { data: routeResult, error: routeError } = await supabase.functions.invoke(
      'route-message',
      { body: normalizedPayload }
    );

    if (routeError) {
      console.error('[ZAPI-WEBHOOK] ❌ Route error:', routeError);
      throw routeError;
    }

    console.log('[ZAPI-WEBHOOK] ✅ Route result:', routeResult);

    // Se route-message retornou uma resposta, enviá-la via Z-API
    if (routeResult?.response) {
      await supabase.functions.invoke('zapi-send-message', {
        body: {
          agentKey: agent.key,
          phone,
          message: routeResult.response
        }
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      agent: agent.key,
      processed: true 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[ZAPI-WEBHOOK] Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
