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

    console.log(`[WEBHOOK] Recebido para agente: ${agentId}`);

    // GET - Verificação do webhook ManyChat
    if (req.method === 'GET') {
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      console.log(`[WEBHOOK] Modo de verificação: ${mode}`);
      
      if (mode === 'subscribe' && token) {
        // TODO: Validar token contra o banco de dados do agente
        return new Response(challenge, { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
        });
      }
    }

    // POST - Recebimento de mensagens
    if (req.method === 'POST') {
      const payload = await req.json();
      
      console.log(`[WEBHOOK] Payload ManyChat recebido:`, JSON.stringify(payload, null, 2));

      const timestamp = new Date().toISOString();
      
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
        console.error('[WEBHOOK] Agente não encontrado:', agentId);
        return new Response(
          JSON.stringify({ error: 'Agente não encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Extrair dados do ManyChat
      const {
        type,
        subscriber_id,
        page_id,
        text,
        full_name,
        timestamp: eventTimestamp
      } = payload;

      console.log('[WEBHOOK] Evento ManyChat:', {
        type,
        subscriber_id,
        page_id,
        text: text?.substring(0, 50),
        full_name
      });

      // Processar evento message_received
      if (type === 'message_received' && text) {
        // Salvar mensagem no banco (se você tiver tabela de mensagens)
        try {
          const messageData = {
            conversation_id: subscriber_id,
            agent_key: agentId,
            direction: 'inbound',
            body: text,
            from_number: subscriber_id,
            from_name: full_name || 'Desconhecido',
            metadata: {
              provider: 'manychat',
              page_id,
              event_type: type,
              raw_payload: payload
            },
            created_at: eventTimestamp ? new Date(eventTimestamp * 1000).toISOString() : timestamp
          };

          console.log('[WEBHOOK] Salvando mensagem:', messageData);

          // Tentar salvar na tabela messages (se existir)
          const { error: msgError } = await supabase
            .from('messages')
            .insert(messageData);

          if (msgError) {
            console.warn('[WEBHOOK] Aviso ao salvar mensagem:', msgError.message);
          }
        } catch (error: any) {
          console.error('[WEBHOOK] Erro ao processar mensagem:', error.message);
        }

        // Chamar roteador para processar com IA (se necessário)
        try {
          const { data: routeData, error: routeError } = await supabase.functions.invoke('route-message', {
            body: {
              message: text,
              conversationId: subscriber_id,
              metadata: { 
                from: full_name || subscriber_id,
                timestamp: eventTimestamp || Date.now(),
                agentId,
                provider: 'manychat'
              }
            }
          });

          if (routeError) {
            console.error('[WEBHOOK] Erro ao rotear mensagem:', routeError);
          } else {
            console.log('[WEBHOOK] Mensagem roteada para:', routeData?.routed_to);
          }
        } catch (error: any) {
          console.warn('[WEBHOOK] Roteamento não disponível:', error.message);
        }
      }

      console.log(`[WEBHOOK] Evento processado com sucesso para ${agentId}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          agentId, 
          timestamp,
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
    console.error('[WEBHOOK] Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
