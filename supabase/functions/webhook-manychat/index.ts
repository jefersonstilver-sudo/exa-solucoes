import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
      
      // TODO: Salvar no Supabase quando houver tabela de mensagens
      // await supabase.from('agent_messages').insert({
      //   agent_id: agentId,
      //   message: payload,
      //   received_at: timestamp
      // });

      console.log(`[WEBHOOK] Mensagem processada com sucesso para ${agentId}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          agentId, 
          timestamp,
          message: 'Webhook recebido e processado'
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
