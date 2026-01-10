/**
 * Edge Function: check-financial-alerts
 * Verificação diária de alertas financeiros (CRON 9h)
 * @version 1.0.0
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔔 [ALERTS] Iniciando verificação de alertas financeiros');

    // Buscar configurações
    const { data: configs } = await supabase
      .from('configuracoes_financeiro')
      .select('chave, valor');

    const getConfig = (key: string, defaultVal: string) => 
      configs?.find(c => c.chave === key)?.valor || defaultVal;

    const diasVencimento = parseInt(getConfig('alerta_vencimento_dias', '3'));
    const caixaMinimo = parseFloat(getConfig('caixa_minimo_alerta', '5000'));
    const diasContrato = parseInt(getConfig('dias_contrato_vencendo', '30'));

    let alertasGerados = 0;
    const hoje = new Date().toISOString().split('T')[0];
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() + diasVencimento);

    // 1. ALERTAS DE VENCIMENTO PRÓXIMO
    const { data: parcelasVencendo } = await supabase
      .from('parcelas')
      .select('*, pedidos(client_id)')
      .in('status', ['pendente', 'aguardando_pagamento'])
      .lte('data_vencimento', dataLimite.toISOString().split('T')[0])
      .gte('data_vencimento', hoje);

    for (const parcela of parcelasVencendo || []) {
      await supabase.rpc('criar_alerta_financeiro', {
        p_tipo: 'vencimento_proximo',
        p_nivel: 'warning',
        p_titulo: `Parcela vencendo em breve`,
        p_mensagem: `Parcela ${parcela.numero_parcela} de R$ ${parcela.valor} vence em ${parcela.data_vencimento}`,
        p_entidade_tipo: 'parcela',
        p_entidade_id: parcela.id,
        p_valor_referencia: parcela.valor,
        p_data_referencia: parcela.data_vencimento
      });
      alertasGerados++;
    }

    // 2. ALERTAS DE INADIMPLÊNCIA
    const { data: parcelasAtrasadas } = await supabase
      .from('parcelas')
      .select('*, pedidos(client_id)')
      .in('status', ['pendente', 'aguardando_pagamento', 'atrasado'])
      .lt('data_vencimento', hoje);

    for (const parcela of parcelasAtrasadas || []) {
      await supabase.rpc('criar_alerta_financeiro', {
        p_tipo: 'inadimplencia',
        p_nivel: 'critical',
        p_titulo: `Parcela em atraso`,
        p_mensagem: `Parcela ${parcela.numero_parcela} de R$ ${parcela.valor} está vencida desde ${parcela.data_vencimento}`,
        p_entidade_tipo: 'parcela',
        p_entidade_id: parcela.id,
        p_valor_referencia: parcela.valor,
        p_data_referencia: parcela.data_vencimento,
        p_notificar_whatsapp: true
      });
      alertasGerados++;
    }

    // 3. ALERTAS DE CONTRATOS VENCENDO
    const dataContratoLimite = new Date();
    dataContratoLimite.setDate(dataContratoLimite.getDate() + diasContrato);

    const { data: contratosVencendo } = await supabase
      .from('contratos_fornecedores')
      .select('*')
      .eq('status', 'ativo')
      .lte('data_fim', dataContratoLimite.toISOString().split('T')[0])
      .gte('data_fim', hoje);

    for (const contrato of contratosVencendo || []) {
      await supabase.rpc('criar_alerta_financeiro', {
        p_tipo: 'contrato_vencendo',
        p_nivel: 'warning',
        p_titulo: `Contrato expirando`,
        p_mensagem: `Contrato com fornecedor expira em ${contrato.data_fim}`,
        p_entidade_tipo: 'contrato_fornecedor',
        p_entidade_id: contrato.id,
        p_valor_referencia: contrato.valor_mensal,
        p_data_referencia: contrato.data_fim
      });
      alertasGerados++;
    }

    console.log(`✅ [ALERTS] ${alertasGerados} alertas verificados/gerados`);

    return new Response(JSON.stringify({
      success: true,
      alertas_gerados: alertasGerados,
      timestamp: new Date().toISOString()
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error("❌ [ALERTS] Error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
