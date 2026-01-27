import { useMemo, useEffect } from 'react';
import { useFinanceiroData } from './useFinanceiroData';
import { useFluxoCaixa } from './useFluxoCaixa';
import { useInadimplentes } from './useInadimplentes';
import { format, startOfMonth, endOfMonth } from 'date-fns';

interface ResultadoFinanceiro {
  // Resultado Atual (realizado no mês)
  resultadoAtual: number;
  receitaRealizada: number;
  despesasTotal: number;
  
  // Resultado Projetado (projeção do MÊS ATUAL, não 90 dias)
  resultadoProjetado: number;
  entradasProjetadas: number;
  saidasProjetadas: number;
  
  // Contas Atrasadas (inadimplentes)
  contasAtrasadasTotal: number;
  contasAtrasadasCount: number;
  
  loading: boolean;
}

export const useResultadoFinanceiro = (): ResultadoFinanceiro => {
  const { metricas, loading: loadingMetricas } = useFinanceiroData();
  const { fluxoCaixa, fetchFluxoCaixa, loading: loadingFluxo } = useFluxoCaixa();
  const { inadimplentes, fetchInadimplentes, loading: loadingInadimplentes } = useInadimplentes();

  // Carregar dados de fluxo de caixa APENAS DO MÊS ATUAL e inadimplentes ao montar
  useEffect(() => {
    // CORREÇÃO CRÍTICA: Buscar apenas o mês atual, não 90 dias
    const inicioMes = format(startOfMonth(new Date()), 'yyyy-MM-dd');
    const fimMes = format(endOfMonth(new Date()), 'yyyy-MM-dd');
    fetchFluxoCaixa(inicioMes, fimMes);
    fetchInadimplentes();
  }, [fetchFluxoCaixa, fetchInadimplentes]);

  const resultado = useMemo(() => {
    // CORREÇÃO: Filtrar apenas registros do mês atual para garantir consistência
    const mesAtual = format(new Date(), 'yyyy-MM');
    const fluxoMesAtual = fluxoCaixa.filter(fc => fc.data.startsWith(mesAtual));

    // Resultado Atual do mês (vem das métricas do backend)
    const receitaRealizada = metricas?.receita_realizada || 0;
    const despesasTotal = metricas?.despesas_total || 0;
    const resultadoAtual = metricas?.resultado_liquido_mes || (receitaRealizada - despesasTotal);

    // Projeção do MÊS ATUAL (calculada a partir dos registros filtrados)
    const projetados = fluxoMesAtual.filter(fc => fc.status === 'projetado');
    const entradasProjetadas = projetados
      .filter(fc => fc.tipo === 'entrada')
      .reduce((sum, fc) => sum + fc.valor, 0);
    const saidasProjetadas = projetados
      .filter(fc => fc.tipo === 'saida')
      .reduce((sum, fc) => sum + fc.valor, 0);
    const resultadoProjetado = entradasProjetadas - saidasProjetadas;

    // Contas atrasadas - somatório dos inadimplentes
    const contasAtrasadasTotal = inadimplentes.reduce((sum, i) => sum + i.total_devido, 0);
    const contasAtrasadasCount = inadimplentes.length;

    return {
      resultadoAtual,
      receitaRealizada,
      despesasTotal,
      resultadoProjetado,
      entradasProjetadas,
      saidasProjetadas,
      contasAtrasadasTotal,
      contasAtrasadasCount,
      loading: loadingMetricas || loadingFluxo || loadingInadimplentes
    };
  }, [metricas, fluxoCaixa, inadimplentes, loadingMetricas, loadingFluxo, loadingInadimplentes]);

  return resultado;
};
