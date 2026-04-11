/**
 * Edge Function: calculate-financial-metrics
 * 
 * Centraliza TODOS os cálculos financeiros no backend.
 * Fonte única da verdade para métricas financeiras do sistema EXA.
 * 
 * Princípio: Nenhum cálculo financeiro crítico pode existir apenas no frontend.
 * 
 * @version 1.0.0
 * @created 2026-01-10
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ========================================
// TIPOS
// ========================================

interface MetricasFinanceiras {
  receita_esperada: number;
  receita_realizada: number;
  receita_pendente: number;
  inadimplencia_total: number;
  inadimplencia_count: number;
  inadimplencia_percentual: number;
  despesas_fixas_mes: number;
  despesas_variaveis_mes: number;
  despesas_total: number;
  impostos_estimados: number;
  impostos_pagos: number;
  impostos_pendentes: number;
  saldo_atual: number;
  saldo_projetado_30d: number;
  margem_liquida: number;
  taxa_inadimplencia: number;
}

interface ClienteInadimplente {
  client_id: string;
  cliente_nome: string;
  cliente_email: string;
  cliente_telefone: string | null;
  total_devido: number;
  dias_atraso_max: number;
  cobrancas_vencidas: number;
  ultima_cobranca: string;
  risco: 'baixo' | 'medio' | 'alto' | 'critico';
  acao_recomendada: string;
}

interface RequestBody {
  competencia?: string; // formato 'yyyy-MM', default: mês atual
}

// ========================================
// FUNÇÕES AUXILIARES
// ========================================

function log(level: 'info' | 'warn' | 'error', message: string, data?: Record<string, unknown>): void {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, level, service: 'calculate-financial-metrics', message, ...data };
  
  if (level === 'error') {
    console.error(JSON.stringify(logEntry));
  } else if (level === 'warn') {
    console.warn(JSON.stringify(logEntry));
  } else {
    console.log(JSON.stringify(logEntry));
  }
}

function getMonthRange(competencia: string): { inicioMes: string; fimMes: string } {
  const [year, month] = competencia.split('-').map(Number);
  const inicioMes = new Date(year, month - 1, 1);
  const fimMes = new Date(year, month, 0); // Último dia do mês
  
  return {
    inicioMes: inicioMes.toISOString().split('T')[0],
    fimMes: fimMes.toISOString().split('T')[0]
  };
}

function calcularRisco(diasAtraso: number, valor: number): 'baixo' | 'medio' | 'alto' | 'critico' {
  if (diasAtraso > 90 || valor > 10000) return 'critico';
  if (diasAtraso > 60 || valor > 5000) return 'alto';
  if (diasAtraso > 30 || valor > 2000) return 'medio';
  return 'baixo';
}

function recomendarAcao(diasAtraso: number): string {
  if (diasAtraso > 90) return 'Negativar / Jurídico';
  if (diasAtraso > 60) return 'Suspender serviço';
  if (diasAtraso > 30) return 'Ligação de cobrança';
  if (diasAtraso > 15) return 'WhatsApp de lembrete';
  return 'Email automático';
}

// ========================================
// HANDLER PRINCIPAL
// ========================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    log('info', '📊 Iniciando cálculo de métricas financeiras');

    // Parse request body
    let competencia: string;
    try {
      const body: RequestBody = await req.json();
      competencia = body.competencia || new Date().toISOString().slice(0, 7); // yyyy-MM
    } catch {
      competencia = new Date().toISOString().slice(0, 7);
    }

    log('info', '📅 Competência', { competencia });

    const { inicioMes, fimMes } = getMonthRange(competencia);

    // Criar cliente Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // ========================================
    // BUSCAR DADOS DO BANCO
    // ========================================

    // 1. Cobranças do mês
    const { data: cobrancasData, error: cobrancasError } = await supabase
      .from('cobrancas')
      .select(`
        *,
        users:client_id (
          full_name,
          email
        )
      `)
      .gte('data_vencimento', inicioMes)
      .lte('data_vencimento', fimMes)
      .order('data_vencimento', { ascending: true });

    if (cobrancasError) {
      log('warn', 'Erro ao buscar cobrancas', { error: cobrancasError.message });
    }

    // 2. Recebimentos do mês
    const { data: recebimentosData, error: recebimentosError } = await supabase
      .from('recebimentos')
      .select('*')
      .gte('data_pagamento', inicioMes)
      .lte('data_pagamento', fimMes)
      .order('data_pagamento', { ascending: false });

    if (recebimentosError) {
      log('warn', 'Erro ao buscar recebimentos', { error: recebimentosError.message });
    }

    // 3. Despesas fixas ativas
    const { data: despesasFixasData, error: despesasFixasError } = await supabase
      .from('despesas_fixas')
      .select('*')
      .eq('ativo', true)
      .order('descricao', { ascending: true });

    if (despesasFixasError) {
      log('warn', 'Erro ao buscar despesas fixas', { error: despesasFixasError.message });
    }

    // 3.1 Parcelas de despesas do mês (NOVA BUSCA)
    const { data: parcelasDespesasData, error: parcelasDespesasError } = await supabase
      .from('parcelas_despesas')
      .select('*')
      .eq('competencia', competencia);

    if (parcelasDespesasError) {
      log('warn', 'Erro ao buscar parcelas de despesas', { error: parcelasDespesasError.message });
    }

    // 4. Despesas variáveis do mês
    const { data: despesasVariaveisData, error: despesasVariaveisError } = await supabase
      .from('despesas_variaveis')
      .select('*')
      .gte('data', inicioMes)
      .lte('data', fimMes)
      .order('data', { ascending: false });

    if (despesasVariaveisError) {
      log('warn', 'Erro ao buscar despesas variáveis', { error: despesasVariaveisError.message });
    }

    // 5. Impostos do mês
    const { data: impostosData, error: impostosError } = await supabase
      .from('impostos')
      .select('*')
      .eq('competencia', competencia);

    if (impostosError) {
      log('warn', 'Erro ao buscar impostos', { error: impostosError.message });
    }

    // 6. Cobranças vencidas (inadimplência)
    const { data: inadimplenciaData, error: inadimplenciaError } = await supabase
      .from('cobrancas')
      .select(`
        *,
        users:client_id (
          id,
          full_name,
          email,
          phone
        )
      `)
      .eq('status', 'vencido')
      .order('dias_atraso', { ascending: false });

    if (inadimplenciaError) {
      log('warn', 'Erro ao buscar inadimplência', { error: inadimplenciaError.message });
    }

    // 7. Parcelas pagas (fonte ASAAS - receita realizada confirmada)
    const { data: parcelasPagasData, error: parcelasPagasError } = await supabase
      .from('parcelas')
      .select('valor, valor_final, data_pagamento, transaction_id')
      .eq('status', 'pago')
      .not('transaction_id', 'is', null) // Apenas confirmados via ASAAS
      .gte('data_pagamento', inicioMes)
      .lte('data_pagamento', fimMes);

    if (parcelasPagasError) {
      log('warn', 'Erro ao buscar parcelas pagas', { error: parcelasPagasError.message });
    }

    // ========================================
    // PROCESSAR DADOS
    // ========================================

    const cobrancas = cobrancasData || [];
    const recebimentos = recebimentosData || [];
    const despesasFixas = despesasFixasData || [];
    const parcelasDespesas = parcelasDespesasData || [];
    const despesasVariaveis = despesasVariaveisData || [];
    const impostos = impostosData || [];
    const inadimplencia = inadimplenciaData || [];
    const parcelasPagas = parcelasPagasData || [];

    // Processar cobranças com nome do cliente
    const cobrancasProcessadas = cobrancas.map((c: any) => ({
      ...c,
      cliente_nome: c.users?.full_name || 'Cliente não identificado',
      cliente_email: c.users?.email
    }));

    // ========================================
    // PROCESSAR INADIMPLENTES
    // ========================================

    const porCliente = new Map<string, any>();

    inadimplencia.forEach((c: any) => {
      const clientId = c.client_id;
      if (!clientId) return;

      if (!porCliente.has(clientId)) {
        porCliente.set(clientId, {
          client_id: clientId,
          cliente_nome: c.users?.full_name || 'Cliente não identificado',
          cliente_email: c.users?.email || '',
          cliente_telefone: c.users?.phone,
          total_devido: 0,
          dias_atraso_max: 0,
          cobrancas_vencidas: 0,
          ultima_cobranca: c.data_vencimento
        });
      }

      const cliente = porCliente.get(clientId);
      cliente.total_devido += Number(c.valor) || 0;
      cliente.dias_atraso_max = Math.max(cliente.dias_atraso_max, c.dias_atraso || 0);
      cliente.cobrancas_vencidas += 1;
    });

    const inadimplentes: ClienteInadimplente[] = Array.from(porCliente.values()).map(cliente => ({
      ...cliente,
      risco: calcularRisco(cliente.dias_atraso_max, cliente.total_devido),
      acao_recomendada: recomendarAcao(cliente.dias_atraso_max)
    }));

    // ========================================
    // CALCULAR MÉTRICAS (SINGLE SOURCE OF TRUTH)
    // ========================================

    // Receitas
    const receita_esperada = cobrancas.reduce((sum: number, c: any) => sum + (Number(c.valor) || 0), 0);
    
    // Receita realizada: priorizar parcelas com transaction_id (ASAAS confirmado)
    const receita_realizada_asaas = parcelasPagas.reduce((sum: number, p: any) => 
      sum + (Number(p.valor_final) || Number(p.valor) || 0), 0);
    const receita_realizada_recebimentos = recebimentos.reduce((sum: number, r: any) => 
      sum + (Number(r.valor_pago) || 0), 0);
    const receita_realizada = Math.max(receita_realizada_asaas, receita_realizada_recebimentos);
    
    const receita_pendente = cobrancas
      .filter((c: any) => c.status === 'pendente')
      .reduce((sum: number, c: any) => sum + (Number(c.valor) || 0), 0);

    // Inadimplência
    const inadimplencia_total = inadimplencia.reduce((sum: number, c: any) => sum + (Number(c.valor) || 0), 0);
    const inadimplencia_count = inadimplencia.length;
    const inadimplencia_percentual = receita_esperada > 0 
      ? (inadimplencia_total / receita_esperada) * 100 
      : 0;

    // Despesas - Priorizar parcelas_despesas para despesas fixas
    // Se tiver parcelas do mês, usa parcelas; senão, fallback para despesas_fixas mensais
    let despesas_fixas_mes: number;
    if (parcelasDespesas.length > 0) {
      // Soma parcelas pendentes ou pagas do mês
      despesas_fixas_mes = parcelasDespesas.reduce((sum: number, p: any) => sum + (Number(p.valor) || 0), 0);
    } else {
      // Fallback: soma despesas fixas mensais
      despesas_fixas_mes = despesasFixas
        .filter((d: any) => d.periodicidade === 'mensal')
        .reduce((sum: number, d: any) => sum + (Number(d.valor) || 0), 0);
    }
    const despesas_variaveis_mes = despesasVariaveis.reduce((sum: number, d: any) => sum + (Number(d.valor) || 0), 0);
    const despesas_total = despesas_fixas_mes + despesas_variaveis_mes;

    // Impostos
    const impostos_estimados = impostos.reduce((sum: number, i: any) => sum + (Number(i.valor_estimado) || 0), 0);
    const impostos_pagos = impostos.reduce((sum: number, i: any) => sum + (Number(i.valor_pago) || 0), 0);
    const impostos_pendentes = impostos_estimados - impostos_pagos;

    // Fluxo de Caixa
    const saldo_atual = receita_realizada - despesas_total - impostos_pagos;
    const saldo_projetado_30d = receita_esperada - despesas_total - impostos_estimados;

    // Indicadores
    const margem_liquida = receita_realizada > 0 
      ? ((receita_realizada - despesas_total - impostos_pagos) / receita_realizada) * 100 
      : 0;
    const taxa_inadimplencia = receita_esperada > 0 
      ? (inadimplencia_total / receita_esperada) * 100 
      : 0;

    const metricas: MetricasFinanceiras = {
      receita_esperada,
      receita_realizada,
      receita_pendente,
      inadimplencia_total,
      inadimplencia_count,
      inadimplencia_percentual,
      despesas_fixas_mes,
      despesas_variaveis_mes,
      despesas_total,
      impostos_estimados,
      impostos_pagos,
      impostos_pendentes,
      saldo_atual,
      saldo_projetado_30d,
      margem_liquida,
      taxa_inadimplencia
    };

    log('info', '✅ Métricas calculadas com sucesso', {
      receita_realizada,
      despesas_total,
      saldo_atual,
      inadimplencia_total,
      fonte_receita: receita_realizada_asaas > 0 ? 'asaas' : 'recebimentos'
    });

    // ========================================
    // RETORNAR RESPOSTA
    // ========================================

    return new Response(JSON.stringify({
      success: true,
      metricas,
      inadimplentes,
      cobrancas: cobrancasProcessadas,
      recebimentos,
      despesas_fixas: despesasFixas,
      despesas_variaveis: despesasVariaveis,
      impostos,
      competencia,
      calculated_at: new Date().toISOString(),
      source: 'backend' // Confirma que cálculos vieram do backend
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    log('error', '❌ Erro no cálculo de métricas', { error: error.message, stack: error.stack });

    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      metricas: null,
      calculated_at: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
