import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  MetricasFinanceiras, 
  Cobranca, 
  Recebimento, 
  DespesaFixa, 
  DespesaVariavel,
  Imposto,
  ClienteInadimplente 
} from '@/types/financeiro';
import { format, startOfMonth, endOfMonth, addDays, subMonths } from 'date-fns';

export const useFinanceiroData = (competencia?: string) => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metricas, setMetricas] = useState<MetricasFinanceiras | null>(null);
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([]);
  const [recebimentos, setRecebimentos] = useState<Recebimento[]>([]);
  const [despesasFixas, setDespesasFixas] = useState<DespesaFixa[]>([]);
  const [despesasVariaveis, setDespesasVariaveis] = useState<DespesaVariavel[]>([]);
  const [impostos, setImpostos] = useState<Imposto[]>([]);
  const [inadimplentes, setInadimplentes] = useState<ClienteInadimplente[]>([]);

  // Competência atual ou fornecida
  const competenciaAtual = competencia || format(new Date(), 'yyyy-MM');
  
  // Verificar permissão financeira
  const temPermissaoFinanceira = useMemo(() => {
    const role = userProfile?.role;
    return ['admin', 'super_admin', 'admin_master', 'financeiro'].includes(role || '');
  }, [userProfile?.role]);

  const fetchData = async () => {
    if (!temPermissaoFinanceira) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const mesAtual = new Date();
      const inicioMes = format(startOfMonth(mesAtual), 'yyyy-MM-dd');
      const fimMes = format(endOfMonth(mesAtual), 'yyyy-MM-dd');

      // Buscar cobranças do mês
      const { data: cobrancasData } = await supabase
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

      // Buscar recebimentos do mês
      const { data: recebimentosData } = await supabase
        .from('recebimentos')
        .select('*')
        .gte('data_pagamento', inicioMes)
        .lte('data_pagamento', fimMes)
        .order('data_pagamento', { ascending: false });

      // Buscar despesas fixas ativas
      const { data: despesasFixasData } = await supabase
        .from('despesas_fixas')
        .select('*')
        .eq('ativo', true)
        .order('descricao', { ascending: true });

      // Buscar despesas variáveis do mês
      const { data: despesasVariaveisData } = await supabase
        .from('despesas_variaveis')
        .select('*')
        .gte('data', inicioMes)
        .lte('data', fimMes)
        .order('data', { ascending: false });

      // Buscar impostos do mês
      const { data: impostosData } = await supabase
        .from('impostos')
        .select('*')
        .eq('competencia', competenciaAtual);

      // Buscar cobranças vencidas (inadimplência)
      const { data: inadimplenciaData } = await supabase
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

      // Processar cobranças
      const cobrancasProcessadas = (cobrancasData || []).map((c: any) => ({
        ...c,
        cliente_nome: c.users?.full_name || 'Cliente não identificado',
        cliente_email: c.users?.email
      })) as Cobranca[];

      setCobrancas(cobrancasProcessadas);
      setRecebimentos((recebimentosData || []) as unknown as Recebimento[]);
      setDespesasFixas((despesasFixasData || []) as unknown as DespesaFixa[]);
      setDespesasVariaveis((despesasVariaveisData || []) as unknown as DespesaVariavel[]);
      setImpostos((impostosData || []) as unknown as Imposto[]);

      // Processar inadimplentes
      const inadimplentesProcessados = processarInadimplentes(inadimplenciaData || []);
      setInadimplentes(inadimplentesProcessados);

      // Calcular métricas
      const metricasCalculadas = calcularMetricas(
        cobrancasProcessadas,
        (recebimentosData || []) as unknown as Recebimento[],
        (despesasFixasData || []) as unknown as DespesaFixa[],
        (despesasVariaveisData || []) as unknown as DespesaVariavel[],
        (impostosData || []) as unknown as Imposto[],
        inadimplenciaData || []
      );
      setMetricas(metricasCalculadas);

    } catch (error) {
      console.error('Erro ao buscar dados financeiros:', error);
    } finally {
      setLoading(false);
    }
  };

  // Processar inadimplentes agrupando por cliente
  const processarInadimplentes = (cobrancasVencidas: any[]): ClienteInadimplente[] => {
    const porCliente = new Map<string, any>();

    cobrancasVencidas.forEach(c => {
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

    return Array.from(porCliente.values()).map(cliente => ({
      ...cliente,
      risco: calcularRisco(cliente.dias_atraso_max, cliente.total_devido),
      acao_recomendada: recomendarAcao(cliente.dias_atraso_max)
    }));
  };

  const calcularRisco = (diasAtraso: number, valor: number): 'baixo' | 'medio' | 'alto' | 'critico' => {
    if (diasAtraso > 90 || valor > 10000) return 'critico';
    if (diasAtraso > 60 || valor > 5000) return 'alto';
    if (diasAtraso > 30 || valor > 2000) return 'medio';
    return 'baixo';
  };

  const recomendarAcao = (diasAtraso: number): string => {
    if (diasAtraso > 90) return 'Negativar / Jurídico';
    if (diasAtraso > 60) return 'Suspender serviço';
    if (diasAtraso > 30) return 'Ligação de cobrança';
    if (diasAtraso > 15) return 'WhatsApp de lembrete';
    return 'Email automático';
  };

  // Calcular métricas financeiras
  const calcularMetricas = (
    cobrancas: Cobranca[],
    recebimentos: any[],
    despesasFixas: DespesaFixa[],
    despesasVariaveis: DespesaVariavel[],
    impostos: Imposto[],
    inadimplencia: any[]
  ): MetricasFinanceiras => {
    // Receitas
    const receita_esperada = cobrancas.reduce((sum, c) => sum + (Number(c.valor) || 0), 0);
    const receita_realizada = recebimentos.reduce((sum, r) => sum + (Number(r.valor_pago) || 0), 0);
    const receita_pendente = cobrancas
      .filter(c => c.status === 'pendente')
      .reduce((sum, c) => sum + (Number(c.valor) || 0), 0);

    // Inadimplência
    const inadimplencia_total = inadimplencia.reduce((sum, c) => sum + (Number(c.valor) || 0), 0);
    const inadimplencia_count = inadimplencia.length;
    const inadimplencia_percentual = receita_esperada > 0 
      ? (inadimplencia_total / receita_esperada) * 100 
      : 0;

    // Despesas
    const despesas_fixas_mes = despesasFixas
      .filter(d => d.periodicidade === 'mensal')
      .reduce((sum, d) => sum + (Number(d.valor) || 0), 0);
    const despesas_variaveis_mes = despesasVariaveis.reduce((sum, d) => sum + (Number(d.valor) || 0), 0);
    const despesas_total = despesas_fixas_mes + despesas_variaveis_mes;

    // Impostos
    const impostos_estimados = impostos.reduce((sum, i) => sum + (Number(i.valor_estimado) || 0), 0);
    const impostos_pagos = impostos.reduce((sum, i) => sum + (Number(i.valor_pago) || 0), 0);
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

    return {
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
  };

  useEffect(() => {
    fetchData();
  }, [temPermissaoFinanceira, competenciaAtual]);

  return {
    loading,
    metricas,
    cobrancas,
    recebimentos,
    despesasFixas,
    despesasVariaveis,
    impostos,
    inadimplentes,
    temPermissaoFinanceira,
    refetch: fetchData
  };
};
