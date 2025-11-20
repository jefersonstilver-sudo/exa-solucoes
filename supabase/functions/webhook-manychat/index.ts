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
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const agentId = pathParts[pathParts.length - 1];

    console.log(`[MANYCHAT-WEBHOOK] Recebido para agente: ${agentId}`);

    // GET - Verificação do webhook ManyChat
    if (req.method === 'GET') {
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      console.log(`[MANYCHAT-WEBHOOK] Modo de verificação: ${mode}`);
      
      if (mode === 'subscribe' && token) {
        return new Response(challenge, { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
        });
      }
    }

    // POST - Recebimento de mensagens
    if (req.method === 'POST') {
      const payload = await req.json();
      
      console.log(`[MANYCHAT-WEBHOOK] Payload recebido:`, JSON.stringify(payload, null, 2));

      // Criar cliente Supabase
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Buscar agente pelo agentId
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('*')
        .eq('key', agentId)
        .single();

      if (agentError || !agent) {
        console.error('[MANYCHAT-WEBHOOK] ❌ Agent not found:', agentId);
        return new Response(
          JSON.stringify({ error: 'Agente não encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('[MANYCHAT-WEBHOOK] ✅ Agent found:', agent.key);

      // Extrair dados do ManyChat
      const {
        type,
        subscriber_id,
        page_id,
        text,
        full_name,
        timestamp: eventTimestamp
      } = payload;

      console.log('[MANYCHAT-WEBHOOK] Evento:', {
        type,
        subscriber_id,
        page_id,
        text: text?.substring(0, 50),
        full_name
      });

      // Processar evento message_received
      if (type === 'message_received' && text) {
        // 1. Criar/Atualizar conversation
        const { data: conversation, error: convError } = await supabase
          .from('conversations')
          .upsert({
            external_id: subscriber_id,
            contact_phone: subscriber_id,
            contact_name: full_name || 'Sem nome',
            agent_key: agentId,
            provider: 'manychat',
            status: 'open',
            last_message_at: new Date().toISOString()
          }, {
            onConflict: 'external_id,agent_key',
            ignoreDuplicates: false
          })
          .select()
          .single();

        if (convError) {
          console.error('[MANYCHAT-WEBHOOK] Error creating conversation:', convError);
          throw convError;
        }

        console.log('[MANYCHAT-WEBHOOK] ✅ Conversation created/updated:', conversation.id);

        // 2. Salvar mensagem
        const { data: savedMessage, error: messageError } = await supabase.from('messages').insert({
          conversation_id: conversation.id,
          agent_key: agentId,
          provider: 'manychat',
          direction: 'inbound',
          from_role: 'user',
          body: text,
          external_message_id: payload.message_id,
          raw_payload: payload
        }).select().single();

        if (messageError) {
          console.error('[MANYCHAT-WEBHOOK] ❌ Error saving message:', messageError);
          throw messageError;
        }

        console.log('[MANYCHAT-WEBHOOK] ✅ Message saved:', savedMessage.id);

        // 3. Chamar route-message com metadata correto
        console.log('[MANYCHAT-WEBHOOK] ✅ Calling route-message...');
        const { data: routeData } = await supabase.functions.invoke('route-message', {
          body: {
            message: text,
            conversationId: conversation.id,
            metadata: { 
              source: 'manychat',
              agentId,
              subscriberId: subscriber_id,
              phone: subscriber_id,
              fullName: full_name
            }
          }
        });

        console.log('[MANYCHAT-WEBHOOK] ✅ Route result:', routeData);

        // 4. Se route-message retornou resposta, enviar via ManyChat
        if (routeData?.response) {
          await supabase.functions.invoke('send-message-unified', {
            body: {
              conversationId: conversation.id,
              agentKey: agentId,
              message: routeData.response,
              metadata: { is_automated: true }
            }
          });

          console.log('[MANYCHAT-WEBHOOK] Response sent');
        }
      }

      console.log(`[MANYCHAT-WEBHOOK] Evento processado com sucesso`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          agentId, 
          event_type: type,
          message: 'Webhook ManyChat recebido e processado'
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response('Método não permitido', { status: 405, headers: corsHeaders });

  } catch (error) {
    console.error('[MANYCHAT-WEBHOOK] Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
