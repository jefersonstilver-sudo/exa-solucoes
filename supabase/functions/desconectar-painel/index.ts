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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { painel_id } = await req.json();

    console.log('🔵 Desconectando painel:', painel_id);

    if (!painel_id) {
      return new Response(
        JSON.stringify({ error: 'ID do painel é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar painel atual
    const { data: painelAtual, error: fetchError } = await supabase
      .from('painels')
      .select('*')
      .eq('id', painel_id)
      .single();

    if (fetchError || !painelAtual) {
      return new Response(
        JSON.stringify({ error: 'Painel não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Gerar novo código de vinculação
    const novo_codigo_vinculacao = Math.floor(10000 + Math.random() * 90000).toString();
    
    console.log('🔑 Novo código gerado:', novo_codigo_vinculacao);

    // Resetar painel para estado aguardando código
    const { data: painelAtualizado, error: updateError } = await supabase
      .from('painels')
      .update({
        status_vinculo: 'aguardando_codigo',
        status: 'desconectado',
        codigo_vinculacao: novo_codigo_vinculacao,
        building_id: null,
        primeira_conexao_at: null,
        ultima_sync: null
      })
      .eq('id', painel_id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erro ao desconectar painel:', updateError);
      return new Response(
        JSON.stringify({ error: 'Erro ao desconectar painel: ' + updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Registrar no log de status
    const { error: statusError } = await supabase
      .from('paineis_status')
      .insert({
        painel_id: painel_id,
        status: 'desconectado',
        observacao: 'Painel desconectado pelo administrador, aguardando nova vinculação'
      });

    if (statusError) {
      console.warn('⚠️ Erro ao registrar status:', statusError);
    }

    console.log('✅ Painel desconectado com sucesso');

    return new Response(
      JSON.stringify({
        success: true,
        painel_id: painelAtualizado.id,
        novo_codigo_vinculacao,
        message: 'Painel desconectado com sucesso. Novo código de vinculação gerado.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
