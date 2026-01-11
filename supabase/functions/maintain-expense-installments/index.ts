import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DespesaFixa {
  id: string;
  valor: number;
  periodicidade: string;
  data_inicio: string;
  dia_vencimento: number;
  ativo: boolean;
}

interface ParcelaDespesa {
  id: string;
  despesa_fixa_id: string;
  competencia: string;
  data_vencimento: string;
  valor: number;
  status: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[maintain-expense-installments] Iniciando manutenção de parcelas...');

    const results = {
      parcelas_criadas: 0,
      parcelas_atualizadas_atrasado: 0,
      alertas_criados: 0,
      erros: [] as string[],
    };

    // ============================================
    // PARTE 1: Atualizar parcelas pendentes → atrasado
    // ============================================
    const hoje = new Date().toISOString().split('T')[0];

    const { data: parcelasVencidas, error: errorVencidas } = await supabase
      .from('parcelas_despesas')
      .update({ 
        status: 'atrasado', 
        updated_at: new Date().toISOString() 
      })
      .eq('status', 'pendente')
      .lt('data_vencimento', hoje)
      .select('id');

    if (errorVencidas) {
      console.error('[maintain-expense-installments] Erro ao atualizar status atrasado:', errorVencidas);
      results.erros.push(`Erro atualização atrasado: ${errorVencidas.message}`);
    } else {
      results.parcelas_atualizadas_atrasado = parcelasVencidas?.length || 0;
      console.log(`[maintain-expense-installments] ${results.parcelas_atualizadas_atrasado} parcelas atualizadas para atrasado`);
    }

    // ============================================
    // PARTE 2: Renovação de parcelas (rolling 12 meses)
    // ============================================
    const { data: despesasAtivas, error: errorDespesas } = await supabase
      .from('despesas_fixas')
      .select('id, valor, periodicidade, data_inicio, dia_vencimento, ativo')
      .eq('ativo', true);

    if (errorDespesas) {
      console.error('[maintain-expense-installments] Erro ao buscar despesas:', errorDespesas);
      results.erros.push(`Erro buscar despesas: ${errorDespesas.message}`);
    } else if (despesasAtivas && despesasAtivas.length > 0) {
      console.log(`[maintain-expense-installments] Processando ${despesasAtivas.length} despesas ativas`);

      for (const despesa of despesasAtivas as DespesaFixa[]) {
        try {
          // Buscar todas as parcelas existentes desta despesa
          const { data: parcelasExistentes } = await supabase
            .from('parcelas_despesas')
            .select('competencia')
            .eq('despesa_fixa_id', despesa.id)
            .order('competencia', { ascending: false });

          const competenciasExistentes = new Set(
            (parcelasExistentes || []).map((p: any) => p.competencia)
          );

          // Calcular próximos 12 meses a partir de hoje
          const hojeDate = new Date();
          const novasParcelas: any[] = [];

          for (let i = 0; i < 12; i++) {
            const mesAlvo = new Date(hojeDate.getFullYear(), hojeDate.getMonth() + i, 1);
            const competencia = `${mesAlvo.getFullYear()}-${String(mesAlvo.getMonth() + 1).padStart(2, '0')}`;

            // Verificar se já existe parcela para esta competência (IDEMPOTÊNCIA)
            if (!competenciasExistentes.has(competencia)) {
              const diaVencimento = despesa.dia_vencimento || 10;
              const ultimoDiaMes = new Date(mesAlvo.getFullYear(), mesAlvo.getMonth() + 1, 0).getDate();
              const diaReal = Math.min(diaVencimento, ultimoDiaMes);
              
              const dataVencimento = new Date(
                mesAlvo.getFullYear(), 
                mesAlvo.getMonth(), 
                diaReal
              ).toISOString().split('T')[0];

              novasParcelas.push({
                despesa_fixa_id: despesa.id,
                competencia,
                data_vencimento: dataVencimento,
                valor: despesa.valor,
                status: 'pendente',
              });
            }
          }

          // Inserir novas parcelas se houver
          if (novasParcelas.length > 0) {
            const { error: insertError } = await supabase
              .from('parcelas_despesas')
              .insert(novasParcelas);

            if (insertError) {
              console.error(`[maintain-expense-installments] Erro ao inserir parcelas para despesa ${despesa.id}:`, insertError);
              results.erros.push(`Erro inserir parcelas despesa ${despesa.id}: ${insertError.message}`);
            } else {
              results.parcelas_criadas += novasParcelas.length;
              console.log(`[maintain-expense-installments] Criadas ${novasParcelas.length} parcelas para despesa ${despesa.id}`);
            }
          }
        } catch (err) {
          console.error(`[maintain-expense-installments] Erro processando despesa ${despesa.id}:`, err);
          results.erros.push(`Erro despesa ${despesa.id}: ${err}`);
        }
      }
    }

    // ============================================
    // PARTE 3: Gerar alertas financeiros
    // ============================================
    
    // 3.1 Alertas de parcelas vencendo em 3 dias
    const tresDias = new Date();
    tresDias.setDate(tresDias.getDate() + 3);
    const dataTresDias = tresDias.toISOString().split('T')[0];

    const { data: parcelasVencendo } = await supabase
      .from('parcelas_despesas')
      .select('id, valor, data_vencimento, despesa_fixa_id')
      .eq('status', 'pendente')
      .gte('data_vencimento', hoje)
      .lte('data_vencimento', dataTresDias);

    for (const parcela of (parcelasVencendo || []) as ParcelaDespesa[]) {
      try {
        const { error: alertError } = await supabase.rpc('criar_alerta_financeiro', {
          p_tipo: 'despesa_vencendo',
          p_nivel: 'warning',
          p_titulo: 'Despesa Vencendo',
          p_mensagem: `Parcela de R$ ${parcela.valor.toFixed(2)} vence em ${parcela.data_vencimento}`,
          p_entidade_tipo: 'parcela_despesa',
          p_entidade_id: parcela.id,
          p_valor_referencia: parcela.valor,
          p_data_referencia: parcela.data_vencimento,
          p_metadata: { despesa_fixa_id: parcela.despesa_fixa_id },
        });

        if (!alertError) {
          results.alertas_criados++;
        }
      } catch (err) {
        console.error(`[maintain-expense-installments] Erro criando alerta vencendo:`, err);
      }
    }

    // 3.2 Alertas de inadimplência (parcelas atrasadas)
    const { data: parcelasAtrasadas } = await supabase
      .from('parcelas_despesas')
      .select('id, valor, data_vencimento, despesa_fixa_id')
      .eq('status', 'atrasado');

    for (const parcela of (parcelasAtrasadas || []) as ParcelaDespesa[]) {
      try {
        const { error: alertError } = await supabase.rpc('criar_alerta_financeiro', {
          p_tipo: 'inadimplencia',
          p_nivel: 'critical',
          p_titulo: 'Despesa em Atraso',
          p_mensagem: `Parcela de R$ ${parcela.valor.toFixed(2)} vencida em ${parcela.data_vencimento}`,
          p_entidade_tipo: 'parcela_despesa',
          p_entidade_id: parcela.id,
          p_valor_referencia: parcela.valor,
          p_data_referencia: parcela.data_vencimento,
          p_metadata: { despesa_fixa_id: parcela.despesa_fixa_id },
        });

        if (!alertError) {
          results.alertas_criados++;
        }
      } catch (err) {
        console.error(`[maintain-expense-installments] Erro criando alerta inadimplência:`, err);
      }
    }

    console.log('[maintain-expense-installments] Manutenção concluída:', results);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Manutenção de parcelas executada com sucesso',
        results,
        executed_at: new Date().toISOString(),
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('[maintain-expense-installments] Erro crítico:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
