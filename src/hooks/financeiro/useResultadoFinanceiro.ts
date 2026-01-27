import { useMemo, useEffect } from 'react';
import { useFinanceiroData } from './useFinanceiroData';
import { useFluxoCaixa } from './useFluxoCaixa';
import { useInadimplentes } from './useInadimplentes';

interface ResultadoFinanceiro {
  // Resultado Atual (realizado no mês)
  resultadoAtual: number;
  receitaRealizada: number;
  despesasTotal: number;
  
  // Resultado Projetado (projeção do mês baseada no fluxo de caixa)
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
  const { resumo, fetchFluxoCaixa, loading: loadingFluxo } = useFluxoCaixa();
  const { inadimplentes, fetchInadimplentes, loading: loadingInadimplentes } = useInadimplentes();

  // Carregar dados de fluxo de caixa e inadimplentes ao montar
  useEffect(() => {
    fetchFluxoCaixa();
    fetchInadimplentes();
  }, [fetchFluxoCaixa, fetchInadimplentes]);

  const resultado = useMemo(() => {
    // Resultado Atual do mês (vem das métricas do backend)
    const receitaRealizada = metricas?.receita_realizada || 0;
    const despesasTotal = metricas?.despesas_total || 0;
    const resultadoAtual = metricas?.resultado_liquido_mes || (receitaRealizada - despesasTotal);

    // Projeção do mês usando o resumo do fluxo de caixa
    // entradasProjetadas e saidasProjetadas vêm do fluxo de caixa (status = 'projetado')
    const entradasProjetadas = resumo.entradasProjetadas || 0;
    const saidasProjetadas = resumo.saidasProjetadas || 0;
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
  }, [metricas, resumo, inadimplentes, loadingMetricas, loadingFluxo, loadingInadimplentes]);

  return resultado;
};
