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
  dia_vencimento: number;
  ativo: boolean;
}

interface AssinaturaOperacional {
  id: string;
  nome: string;
  valor: number;
  periodicidade: string;
  data_proximo_vencimento: string;
  dia_vencimento: number;
  nivel_criticidade: string;
  impacto_descricao: string;
  sistemas_afetados: string[];
  responsavel_email: string | null;
  status_operacional: string;
}

interface ParcelaDespesa {
  id: string;
  despesa_fixa_id: string | null;
  origem: string;
  origem_id: string | null;
  competencia: string;
  data_vencimento: string;
  valor: number;
  status: string;
}

// Matriz de escalonamento de alertas por criticidade
const ALERT_MATRIX = {
  critico: { dias_warning: 7, dias_risco: 3, dias_critico: 1 },
  alto: { dias_warning: 5, dias_risco: 2, dias_critico: 0 },
  medio: { dias_warning: 3, dias_risco: 0, dias_critico: 0 },
  baixo: { dias_warning: 2, dias_risco: 0, dias_critico: 0 },
};

function calcularDiasAteVencimento(dataVencimento: string): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const venc = new Date(dataVencimento);
  venc.setHours(0, 0, 0, 0);
  return Math.ceil((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

function determinarTipoAlertaAssinatura(
  diasAteVencimento: number, 
  criticidade: string
): { tipo: string; nivel: string } | null {
  const matrix = ALERT_MATRIX[criticidade as keyof typeof ALERT_MATRIX] || ALERT_MATRIX.baixo;
  
  if (diasAteVencimento < 0) {
    // Já venceu
    return { tipo: 'assinatura_suspensa', nivel: 'critical' };
  }
  
  if (matrix.dias_critico > 0 && diasAteVencimento <= matrix.dias_critico) {
    return { tipo: 'assinatura_critica', nivel: 'critical' };
  }
  
  if (matrix.dias_risco > 0 && diasAteVencimento <= matrix.dias_risco) {
    return { tipo: 'assinatura_em_risco', nivel: 'warning' };
  }
  
  if (diasAteVencimento <= matrix.dias_warning) {
    return { tipo: 'assinatura_vencendo', nivel: 'warning' };
  }
  
  return null; // Não precisa de alerta
}

function determinarStatusOperacional(
  diasAteVencimento: number, 
  criticidade: string, 
  temParcelaAtrasada: boolean
): string {
  if (temParcelaAtrasada) {
    return 'suspensa';
  }
  
  const matrix = ALERT_MATRIX[criticidade as keyof typeof ALERT_MATRIX] || ALERT_MATRIX.baixo;
  
  if (matrix.dias_critico > 0 && diasAteVencimento <= matrix.dias_critico) {
    return 'em_risco';
  }
  
  if (matrix.dias_risco > 0 && diasAteVencimento <= matrix.dias_risco) {
    return 'em_risco';
  }
  
  if (diasAteVencimento <= matrix.dias_warning) {
    return 'atencao';
  }
  
  return 'normal';
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

    console.log('[maintain-expense-installments] Iniciando manutenção unificada (despesas + assinaturas)...');

    const results = {
      // Despesas Fixas
      parcelas_despesas_criadas: 0,
      parcelas_despesas_atualizadas_atrasado: 0,
      // Assinaturas
      parcelas_assinaturas_criadas: 0,
      parcelas_assinaturas_atualizadas_atrasado: 0,
      status_operacional_atualizados: 0,
      // Alertas
      alertas_criados: 0,
      alertas_assinaturas_criados: 0,
      // Erros
      erros: [] as string[],
    };

    const hoje = new Date().toISOString().split('T')[0];

    // ============================================
    // PARTE 1: Atualizar parcelas pendentes → atrasado (TODAS as origens)
    // ============================================
    const { data: parcelasVencidas, error: errorVencidas } = await supabase
      .from('parcelas_despesas')
      .update({ 
        status: 'atrasado', 
        updated_at: new Date().toISOString() 
      })
      .eq('status', 'pendente')
      .lt('data_vencimento', hoje)
      .select('id, origem');

    if (errorVencidas) {
      console.error('[maintain-expense-installments] Erro ao atualizar status atrasado:', errorVencidas);
      results.erros.push(`Erro atualização atrasado: ${errorVencidas.message}`);
    } else {
      const parcelasArray = parcelasVencidas || [];
      results.parcelas_despesas_atualizadas_atrasado = parcelasArray.filter((p: any) => p.origem === 'despesa_fixa').length;
      results.parcelas_assinaturas_atualizadas_atrasado = parcelasArray.filter((p: any) => p.origem === 'assinatura').length;
      console.log(`[maintain-expense-installments] ${parcelasArray.length} parcelas atualizadas para atrasado`);
    }

    // ============================================
    // PARTE 2: Renovação de parcelas - DESPESAS FIXAS (rolling 12 meses)
    // ============================================
    const { data: despesasAtivas, error: errorDespesas } = await supabase
      .from('despesas_fixas')
      .select('id, valor, periodicidade, dia_vencimento, ativo')
      .eq('ativo', true);

    if (errorDespesas) {
      console.error('[maintain-expense-installments] Erro ao buscar despesas:', errorDespesas);
      results.erros.push(`Erro buscar despesas: ${errorDespesas.message}`);
    } else if (despesasAtivas && despesasAtivas.length > 0) {
      console.log(`[maintain-expense-installments] Processando ${despesasAtivas.length} despesas ativas`);

      for (const despesa of despesasAtivas as DespesaFixa[]) {
        try {
          const { data: parcelasExistentes } = await supabase
            .from('parcelas_despesas')
            .select('competencia')
            .eq('despesa_fixa_id', despesa.id)
            .eq('origem', 'despesa_fixa')
            .order('competencia', { ascending: false });

          const competenciasExistentes = new Set(
            (parcelasExistentes || []).map((p: any) => p.competencia)
          );

          const hojeDate = new Date();
          const novasParcelas: any[] = [];

          for (let i = 0; i < 12; i++) {
            const mesAlvo = new Date(hojeDate.getFullYear(), hojeDate.getMonth() + i, 1);
            const competencia = `${mesAlvo.getFullYear()}-${String(mesAlvo.getMonth() + 1).padStart(2, '0')}`;

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
                origem: 'despesa_fixa',
                origem_id: null,
                competencia,
                data_vencimento: dataVencimento,
                valor: despesa.valor,
                status: 'pendente',
              });
            }
          }

          if (novasParcelas.length > 0) {
            const { error: insertError } = await supabase
              .from('parcelas_despesas')
              .insert(novasParcelas);

            if (insertError) {
              console.error(`[maintain-expense-installments] Erro ao inserir parcelas para despesa ${despesa.id}:`, insertError);
              results.erros.push(`Erro inserir parcelas despesa ${despesa.id}: ${insertError.message}`);
            } else {
              results.parcelas_despesas_criadas += novasParcelas.length;
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
    // PARTE 2.5: Renovação de parcelas - ASSINATURAS OPERACIONAIS (rolling 12 meses)
    // ============================================
    const { data: assinaturasAtivas, error: errorAssinaturas } = await supabase
      .from('assinaturas_operacionais')
      .select('id, nome, valor, periodicidade, data_proximo_vencimento, dia_vencimento, nivel_criticidade, impacto_descricao, sistemas_afetados, responsavel_email, status_operacional')
      .eq('ativo', true);

    if (errorAssinaturas) {
      console.error('[maintain-expense-installments] Erro ao buscar assinaturas:', errorAssinaturas);
      results.erros.push(`Erro buscar assinaturas: ${errorAssinaturas.message}`);
    } else if (assinaturasAtivas && assinaturasAtivas.length > 0) {
      console.log(`[maintain-expense-installments] Processando ${assinaturasAtivas.length} assinaturas ativas`);

      for (const assinatura of assinaturasAtivas as AssinaturaOperacional[]) {
        try {
          // Buscar parcelas existentes desta assinatura
          const { data: parcelasExistentes } = await supabase
            .from('parcelas_despesas')
            .select('competencia, status')
            .eq('origem', 'assinatura')
            .eq('origem_id', assinatura.id)
            .order('competencia', { ascending: false });

          const competenciasExistentes = new Set(
            (parcelasExistentes || []).map((p: any) => p.competencia)
          );

          // Verificar se tem parcela atrasada
          const temParcelaAtrasada = (parcelasExistentes || []).some((p: any) => p.status === 'atrasado');

          const hojeDate = new Date();
          const novasParcelas: any[] = [];

          // Gerar parcelas para próximos 12 meses
          for (let i = 0; i < 12; i++) {
            const mesAlvo = new Date(hojeDate.getFullYear(), hojeDate.getMonth() + i, 1);
            const competencia = `${mesAlvo.getFullYear()}-${String(mesAlvo.getMonth() + 1).padStart(2, '0')}`;

            if (!competenciasExistentes.has(competencia)) {
              const diaVencimento = assinatura.dia_vencimento || 10;
              const ultimoDiaMes = new Date(mesAlvo.getFullYear(), mesAlvo.getMonth() + 1, 0).getDate();
              const diaReal = Math.min(diaVencimento, ultimoDiaMes);
              
              const dataVencimento = new Date(
                mesAlvo.getFullYear(), 
                mesAlvo.getMonth(), 
                diaReal
              ).toISOString().split('T')[0];

              novasParcelas.push({
                despesa_fixa_id: null, // NULL para assinaturas
                origem: 'assinatura',
                origem_id: assinatura.id,
                competencia,
                data_vencimento: dataVencimento,
                valor: assinatura.valor,
                status: 'pendente',
              });
            }
          }

          if (novasParcelas.length > 0) {
            const { error: insertError } = await supabase
              .from('parcelas_despesas')
              .insert(novasParcelas);

            if (insertError) {
              console.error(`[maintain-expense-installments] Erro ao inserir parcelas para assinatura ${assinatura.nome}:`, insertError);
              results.erros.push(`Erro inserir parcelas assinatura ${assinatura.nome}: ${insertError.message}`);
            } else {
              results.parcelas_assinaturas_criadas += novasParcelas.length;
              console.log(`[maintain-expense-installments] Criadas ${novasParcelas.length} parcelas para assinatura ${assinatura.nome}`);
            }
          }

          // ============================================
          // PARTE 2.6: Atualizar status_operacional da assinatura
          // ============================================
          const diasAteVencimento = calcularDiasAteVencimento(assinatura.data_proximo_vencimento);
          const novoStatusOperacional = determinarStatusOperacional(
            diasAteVencimento, 
            assinatura.nivel_criticidade, 
            temParcelaAtrasada
          );

          if (novoStatusOperacional !== assinatura.status_operacional) {
            const { error: updateError } = await supabase
              .from('assinaturas_operacionais')
              .update({ 
                status_operacional: novoStatusOperacional,
                updated_at: new Date().toISOString()
              })
              .eq('id', assinatura.id);

            if (!updateError) {
              results.status_operacional_atualizados++;
              console.log(`[maintain-expense-installments] Assinatura ${assinatura.nome}: status ${assinatura.status_operacional} → ${novoStatusOperacional}`);
            }
          }

          // ============================================
          // PARTE 2.7: Gerar alertas para assinaturas (com escalonamento)
          // ============================================
          const alertaInfo = determinarTipoAlertaAssinatura(diasAteVencimento, assinatura.nivel_criticidade);
          
          if (alertaInfo) {
            try {
              const mensagem = diasAteVencimento < 0 
                ? `🚨 ${assinatura.nome} está ATRASADA - Impacto: ${assinatura.impacto_descricao}`
                : `${assinatura.nome} vence em ${diasAteVencimento} dia(s) - Impacto: ${assinatura.impacto_descricao}`;

              const { error: alertError } = await supabase.rpc('criar_alerta_financeiro', {
                p_tipo: alertaInfo.tipo,
                p_nivel: alertaInfo.nivel,
                p_titulo: `Assinatura: ${assinatura.nome}`,
                p_mensagem: mensagem,
                p_entidade_tipo: 'assinatura',
                p_entidade_id: assinatura.id,
                p_valor_referencia: assinatura.valor,
                p_data_referencia: assinatura.data_proximo_vencimento,
                p_metadata: { 
                  criticidade: assinatura.nivel_criticidade,
                  sistemas_afetados: assinatura.sistemas_afetados,
                  impacto: assinatura.impacto_descricao,
                  responsavel_email: assinatura.responsavel_email,
                  dias_ate_vencimento: diasAteVencimento
                },
                p_notificar_whatsapp: ['critico', 'alto'].includes(assinatura.nivel_criticidade) && diasAteVencimento <= 3
              });

              if (!alertError) {
                results.alertas_assinaturas_criados++;
              }
            } catch (err) {
              console.error(`[maintain-expense-installments] Erro criando alerta para assinatura ${assinatura.nome}:`, err);
            }
          }

        } catch (err) {
          console.error(`[maintain-expense-installments] Erro processando assinatura ${assinatura.id}:`, err);
          results.erros.push(`Erro assinatura ${assinatura.id}: ${err}`);
        }
      }
    }

    // ============================================
    // PARTE 3: Gerar alertas financeiros para DESPESAS FIXAS
    // ============================================
    
    // 3.1 Alertas de parcelas vencendo em 3 dias
    const tresDias = new Date();
    tresDias.setDate(tresDias.getDate() + 3);
    const dataTresDias = tresDias.toISOString().split('T')[0];

    const { data: parcelasVencendo } = await supabase
      .from('parcelas_despesas')
      .select('id, valor, data_vencimento, despesa_fixa_id')
      .eq('status', 'pendente')
      .eq('origem', 'despesa_fixa') // Apenas despesas fixas aqui
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

    // 3.2 Alertas de inadimplência (parcelas atrasadas de despesas fixas)
    const { data: parcelasAtrasadas } = await supabase
      .from('parcelas_despesas')
      .select('id, valor, data_vencimento, despesa_fixa_id')
      .eq('status', 'atrasado')
      .eq('origem', 'despesa_fixa'); // Apenas despesas fixas aqui

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

    console.log('[maintain-expense-installments] Manutenção unificada concluída:', results);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Manutenção unificada (despesas + assinaturas) executada com sucesso',
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