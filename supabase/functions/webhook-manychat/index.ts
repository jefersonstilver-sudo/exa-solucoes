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
      
      console.log(`[WEBHOOK] Payload recebido:`, JSON.stringify(payload));

      const timestamp = new Date().toISOString();
      
      // Chamar roteador para processar mensagem
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const { data: routeData, error: routeError } = await supabase.functions.invoke('route-message', {
        body: {
          message: payload.message?.text || '',
          conversationId: payload.conversation_id || `conv_${Date.now()}`,
          metadata: { 
            from: payload.from, 
            timestamp: payload.timestamp,
            agentId 
          }
        }
      });

      if (routeError) {
        console.error('[WEBHOOK] Erro ao rotear mensagem:', routeError);
      } else {
        console.log('[WEBHOOK] Mensagem roteada para:', routeData?.routed_to);
      }

      console.log(`[WEBHOOK] Mensagem processada com sucesso para ${agentId}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          agentId, 
          timestamp,
          message: 'Webhook recebido e processado',
          routed_to: routeData?.routed_to
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
