import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
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

    const { codigo, device_info } = await req.json();

    if (!codigo) {
      throw new Error('Código de vínculo é obrigatório');
    }

    // Buscar vínculo pendente
    const { data: vinculo, error: vinculoError } = await supabaseClient
      .from('paineis_vinculos')
      .select('*, buildings(nome, endereco, bairro)')
      .eq('codigo', codigo.toUpperCase())
      .eq('status', 'pending')
      .single();

    if (vinculoError || !vinculo) {
      throw new Error('Código inválido ou já utilizado');
    }

    // Verificar se não expirou
    if (new Date(vinculo.expira_em) < new Date()) {
      await supabaseClient
        .from('paineis_vinculos')
        .update({ status: 'expired' })
        .eq('id', vinculo.id);

      throw new Error('Código expirado');
    }

    let painelId = vinculo.painel_id;

    // Se não tem painel vinculado, criar novo
    if (!painelId) {
      const { data: newPanel, error: panelError } = await supabaseClient
        .from('painels')
        .insert({
          code: `PAINEL-${Date.now()}`,
          building_id: vinculo.building_id,
          status: 'online',
          localizacao: 'Não especificado',
        })
        .select()
        .single();

      if (panelError) throw panelError;
      painelId = newPanel.id;

      // Atualizar vínculo com o painel
      await supabaseClient
        .from('paineis_vinculos')
        .update({ painel_id: painelId })
        .eq('id', vinculo.id);
    }

    // Marcar vínculo como ativo
    const { error: updateError } = await supabaseClient
      .from('paineis_vinculos')
      .update({
        status: 'active',
        vinculado_em: new Date().toISOString(),
      })
      .eq('id', vinculo.id);

    if (updateError) throw updateError;

    // Criar/atualizar status do painel
    await supabaseClient
      .from('paineis_status')
      .upsert({
        painel_id: painelId,
        status: 'online',
        ultimo_heartbeat: new Date().toISOString(),
        device_info,
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown',
      });

    // Buscar URL do prédio (assumindo que existe uma coluna ou configuração)
    const urlPainel = `/painel/${vinculo.buildings.nome.toLowerCase().replace(/\s+/g, '-')}/${painelId}`;

    console.log(`✅ Painel vinculado: ${painelId} ao prédio ${vinculo.buildings.nome}`);

    return new Response(
      JSON.stringify({
        success: true,
        painel_id: painelId,
        building: vinculo.buildings,
        url_painel: urlPainel,
        token: painelId, // Token para autenticação do heartbeat
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Erro ao vincular painel:', error);
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
