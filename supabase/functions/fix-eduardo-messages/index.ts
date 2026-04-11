import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
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

    console.log('[FIX-EDUARDO] Iniciando correção de mensagens do Eduardo...');

    // Buscar mensagens de hoje do Eduardo que podem estar com direction errada
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select(`
        id,
        conversation_id,
        direction,
        body,
        raw_payload,
        created_at,
        conversations!inner(agent_key, contact_phone)
      `)
      .eq('conversations.agent_key', 'eduardo')
      .gte('created_at', today.toISOString());

    if (messagesError) {
      console.error('[FIX-EDUARDO] Erro ao buscar mensagens:', messagesError);
      throw messagesError;
    }

    console.log(`[FIX-EDUARDO] Encontradas ${messages?.length || 0} mensagens de hoje`);

    let fixed = 0;
    let errors = 0;

    // Verificar cada mensagem para ver se a direction está correta
    for (const msg of messages || []) {
      const rawPayload = msg.raw_payload as any;
      
      // Se o raw_payload tem fromMe: true, a mensagem deveria ser outbound
      if (rawPayload?.fromMe === true && msg.direction === 'inbound') {
        console.log('[FIX-EDUARDO] 🔧 Corrigindo mensagem:', {
          id: msg.id,
          currentDirection: msg.direction,
          shouldBe: 'outbound',
          text: msg.body?.substring(0, 50)
        });

        const { error: updateError } = await supabase
          .from('messages')
          .update({ 
            direction: 'outbound',
            from_role: 'agent'
          })
          .eq('id', msg.id);

        if (updateError) {
          console.error('[FIX-EDUARDO] Erro ao atualizar mensagem:', updateError);
          errors++;
        } else {
          fixed++;
        }
      }
    }

    console.log('[FIX-EDUARDO] ✅ Correção concluída:', {
      total: messages?.length || 0,
      fixed,
      errors
    });

    return new Response(
      JSON.stringify({
        success: true,
        total: messages?.length || 0,
        fixed,
        errors
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('[FIX-EDUARDO] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
