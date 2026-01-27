import { useMemo } from 'react';
import { useFinanceiroData } from './useFinanceiroData';
import { useFluxoCaixa } from './useFluxoCaixa';

interface ResultadoFinanceiro {
  // Resultado Atual (realizado no mês)
  resultadoAtual: number;
  receitaRealizada: number;
  despesasTotal: number;
  
  // Resultado Projetado (próximos 30 dias)
  resultadoProjetado: number;
  entradasProjetadas: number;
  saidasProjetadas: number;
  
  loading: boolean;
}

export const useResultadoFinanceiro = (): ResultadoFinanceiro => {
  const { metricas, loading: loadingMetricas } = useFinanceiroData();
  const { projecao30d, loading: loadingFluxo } = useFluxoCaixa();

  const resultado = useMemo(() => {
    // Resultado Atual do mês
    const receitaRealizada = metricas?.receita_realizada || 0;
    const despesasTotal = metricas?.despesas_total || 0;
    const resultadoAtual = metricas?.resultado_liquido_mes || (receitaRealizada - despesasTotal);

    // Projeção 30 dias
    const entradasProjetadas = projecao30d.reduce((sum, p) => sum + p.entradas, 0);
    const saidasProjetadas = projecao30d.reduce((sum, p) => sum + p.saidas, 0);
    const resultadoProjetado = entradasProjetadas - saidasProjetadas;

    return {
      resultadoAtual,
      receitaRealizada,
      despesasTotal,
      resultadoProjetado,
      entradasProjetadas,
      saidasProjetadas,
      loading: loadingMetricas || loadingFluxo
    };
  }, [metricas, projecao30d, loadingMetricas, loadingFluxo]);

  return resultado;
};
