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

    const { numero_painel } = await req.json();

    console.log('🔵 Criando novo painel:', numero_painel);

    // Validar número do painel
    if (!numero_painel || numero_painel.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Número do painel é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se o número já existe
    const { data: existingPanel } = await supabase
      .from('painels')
      .select('id')
      .eq('numero_painel', numero_painel)
      .single();

    if (existingPanel) {
      return new Response(
        JSON.stringify({ error: 'Este número de painel já existe' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Gerar token único
    const token_acesso = crypto.randomUUID();
    
    // Gerar código legível
    const code = `EXA-PAINEL-${numero_painel}`;
    
    // Gerar código de vinculação de 5 dígitos (apenas números)
    const codigo_vinculacao = Math.floor(10000 + Math.random() * 90000).toString();
    
    // Gerar link de instalação usando domínio de produção
    const link_instalacao = `https://64f6806c-c0e0-422b-b85f-955fd5719544.lovableproject.com/painel-kiosk/${token_acesso}`;

    console.log('🔵 Link de instalação:', link_instalacao);
    console.log('🔑 Código de vinculação:', codigo_vinculacao);

    // Criar painel no banco
    const { data: newPanel, error: insertError } = await supabase
      .from('painels')
      .insert({
        numero_painel,
        code,
        token_acesso,
        codigo_vinculacao,
        link_instalacao,
        status_vinculo: 'aguardando_codigo',
        status: 'aguardando_codigo',
        resolucao: '1920x1080',
        orientacao: 'horizontal',
        sistema_operacional: 'linux'
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Erro ao criar painel:', insertError);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar painel: ' + insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar entrada inicial no status
    const { error: statusError } = await supabase
      .from('paineis_status')
      .insert({
        painel_id: newPanel.id,
        status: 'aguardando_codigo',
        observacao: 'Painel criado, aguardando código de vinculação'
      });

    if (statusError) {
      console.warn('⚠️ Erro ao criar status inicial:', statusError);
    }

    console.log('✅ Painel criado com sucesso:', newPanel.id);

    return new Response(
      JSON.stringify({
        success: true,
        painel_id: newPanel.id,
        numero_painel,
        code,
        codigo_vinculacao,
        link_instalacao,
        token_acesso,
        qr_code_data: link_instalacao
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
