import { useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, addDays, addMonths, startOfMonth, endOfMonth } from 'date-fns';
import { FluxoCaixaItem } from '@/types/financeiro';

interface FluxoCaixaProjecao {
  data: string;
  entradas: number;
  saidas: number;
  saldo: number;
  saldoAcumulado: number;
}

export const useFluxoCaixa = () => {
  const [loading, setLoading] = useState(false);
  const [fluxoCaixa, setFluxoCaixa] = useState<FluxoCaixaItem[]>([]);
  const [projecao30d, setProjecao30d] = useState<FluxoCaixaProjecao[]>([]);
  const [projecao60d, setProjecao60d] = useState<FluxoCaixaProjecao[]>([]);
  const [projecao90d, setProjecao90d] = useState<FluxoCaixaProjecao[]>([]);

  const fetchFluxoCaixa = useCallback(async (dataInicio?: string, dataFim?: string) => {
    setLoading(true);
    try {
      const inicio = dataInicio || format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const fim = dataFim || format(addDays(new Date(), 90), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('fluxo_caixa')
        .select('*')
        .gte('data_prevista', inicio)
        .lte('data_prevista', fim)
        .order('data_prevista', { ascending: true });

      if (error) throw error;

      const items: FluxoCaixaItem[] = (data || []).map((fc: any) => ({
        data: fc.data_real || fc.data_prevista,
        tipo: fc.tipo as 'entrada' | 'saida',
        descricao: fc.descricao,
        valor: Number(fc.valor),
        categoria: fc.categoria || 'outros',
        status: fc.status as 'realizado' | 'projetado'
      }));

      setFluxoCaixa(items);
      calcularProjecoes(items);
      return items;
    } catch (error) {
      console.error('Erro ao buscar fluxo de caixa:', error);
      toast.error('Erro ao carregar fluxo de caixa');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const calcularProjecoes = useCallback((items: FluxoCaixaItem[]) => {
    const hoje = new Date();
    
    const calcularPeriodo = (dias: number): FluxoCaixaProjecao[] => {
      const resultado: FluxoCaixaProjecao[] = [];
      let saldoAcumulado = 0;

      for (let i = 0; i < dias; i++) {
        const data = format(addDays(hoje, i), 'yyyy-MM-dd');
        const itemsDoDia = items.filter(item => item.data === data);
        
        const entradas = itemsDoDia
          .filter(item => item.tipo === 'entrada')
          .reduce((sum, item) => sum + item.valor, 0);
        
        const saidas = itemsDoDia
          .filter(item => item.tipo === 'saida')
          .reduce((sum, item) => sum + item.valor, 0);
        
        const saldo = entradas - saidas;
        saldoAcumulado += saldo;

        if (entradas > 0 || saidas > 0) {
          resultado.push({
            data,
            entradas,
            saidas,
            saldo,
            saldoAcumulado
          });
        }
      }

      return resultado;
    };

    setProjecao30d(calcularPeriodo(30));
    setProjecao60d(calcularPeriodo(60));
    setProjecao90d(calcularPeriodo(90));
  }, []);

  // Resumo geral
  const resumo = useMemo(() => {
    const realizados = fluxoCaixa.filter(fc => fc.status === 'realizado');
    const projetados = fluxoCaixa.filter(fc => fc.status === 'projetado');

    const entradasRealizadas = realizados
      .filter(fc => fc.tipo === 'entrada')
      .reduce((sum, fc) => sum + fc.valor, 0);

    const saidasRealizadas = realizados
      .filter(fc => fc.tipo === 'saida')
      .reduce((sum, fc) => sum + fc.valor, 0);

    const entradasProjetadas = projetados
      .filter(fc => fc.tipo === 'entrada')
      .reduce((sum, fc) => sum + fc.valor, 0);

    const saidasProjetadas = projetados
      .filter(fc => fc.tipo === 'saida')
      .reduce((sum, fc) => sum + fc.valor, 0);

    return {
      saldoAtual: entradasRealizadas - saidasRealizadas,
      entradasRealizadas,
      saidasRealizadas,
      entradasProjetadas,
      saidasProjetadas,
      saldoProjetado: (entradasRealizadas - saidasRealizadas) + (entradasProjetadas - saidasProjetadas)
    };
  }, [fluxoCaixa]);

  // Projeção por período
  const getProjecaoPeriodo = useCallback((dias: 30 | 60 | 90) => {
    switch (dias) {
      case 30: return projecao30d;
      case 60: return projecao60d;
      case 90: return projecao90d;
    }
  }, [projecao30d, projecao60d, projecao90d]);

  // Gerar fluxo de despesas fixas
  const gerarFluxoDespesasFixas = useCallback(async () => {
    try {
      const { error } = await supabase.rpc('gerar_fluxo_despesas_fixas');
      if (error) throw error;
      toast.success('Fluxo de despesas fixas atualizado');
      return true;
    } catch (error) {
      console.error('Erro ao gerar fluxo de despesas:', error);
      toast.error('Erro ao atualizar fluxo');
      return false;
    }
  }, []);

  return {
    loading,
    fluxoCaixa,
    projecao30d,
    projecao60d,
    projecao90d,
    resumo,
    fetchFluxoCaixa,
    getProjecaoPeriodo,
    gerarFluxoDespesasFixas
  };
};
