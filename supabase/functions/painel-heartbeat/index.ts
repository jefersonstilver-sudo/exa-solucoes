import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { painel_id, url_atual, device_info, erro } = await req.json();

    if (!painel_id) {
      throw new Error('painel_id é obrigatório');
    }

    // Atualizar status do painel
    const { error } = await supabaseClient
      .from('paineis_status')
      .upsert({
        painel_id,
        status: erro ? 'error' : 'online',
        ultimo_heartbeat: new Date().toISOString(),
        url_atual,
        device_info,
        erro_ultimo: erro || null,
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown',
        atualizado_em: new Date().toISOString(),
      });

    if (error) throw error;

    // Verificar se há comandos pendentes para este painel
    const { data: comandosPendentes } = await supabaseClient
      .from('paineis_comandos')
      .select('*')
      .eq('painel_id', painel_id)
      .eq('status', 'pendente')
      .order('criado_em', { ascending: true })
      .limit(5);

    console.log(`💓 Heartbeat recebido do painel ${painel_id} - Status: ${erro ? 'error' : 'online'}`);

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        comandos_pendentes: comandosPendentes || [],
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Erro no heartbeat:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
