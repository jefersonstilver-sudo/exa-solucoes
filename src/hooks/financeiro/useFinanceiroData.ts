/**
 * useFinanceiroData - Hook Financeiro Refatorado
 * 
 * PRINCÍPIO: Este hook apenas CONSOME dados da Edge Function.
 * TODOS os cálculos financeiros são feitos no backend (calculate-financial-metrics).
 * 
 * @refactored 2026-01-10
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
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
import { format } from 'date-fns';

interface FinanceiroDataResponse {
  success: boolean;
  metricas: MetricasFinanceiras | null;
  inadimplentes: ClienteInadimplente[];
  cobrancas: Cobranca[];
  recebimentos: Recebimento[];
  despesas_fixas: DespesaFixa[];
  despesas_variaveis: DespesaVariavel[];
  impostos: Imposto[];
  competencia: string;
  calculated_at: string;
  source: string;
  error?: string;
}

export const useFinanceiroData = (competencia?: string) => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metricas, setMetricas] = useState<MetricasFinanceiras | null>(null);
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([]);
  const [recebimentos, setRecebimentos] = useState<Recebimento[]>([]);
  const [despesasFixas, setDespesasFixas] = useState<DespesaFixa[]>([]);
  const [despesasVariaveis, setDespesasVariaveis] = useState<DespesaVariavel[]>([]);
  const [impostos, setImpostos] = useState<Imposto[]>([]);
  const [inadimplentes, setInadimplentes] = useState<ClienteInadimplente[]>([]);
  const [lastCalculatedAt, setLastCalculatedAt] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<string>('pending');

  // Competência atual ou fornecida
  const competenciaAtual = competencia || format(new Date(), 'yyyy-MM');
  
  // Verificar permissão financeira
  const temPermissaoFinanceira = useMemo(() => {
    const role = userProfile?.role;
    return ['admin', 'super_admin', 'admin_master', 'financeiro'].includes(role || '');
  }, [userProfile?.role]);

  /**
   * Busca dados financeiros centralizados do backend
   * ZERO cálculos no frontend - apenas consumo da Edge Function
   */
  const fetchData = useCallback(async () => {
    if (!temPermissaoFinanceira) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('📊 [useFinanceiroData] Buscando métricas do backend...', { competencia: competenciaAtual });

      const { data, error: invokeError } = await supabase.functions.invoke<FinanceiroDataResponse>(
        'calculate-financial-metrics',
        { 
          body: { competencia: competenciaAtual }
        }
      );

      if (invokeError) {
        throw new Error(invokeError.message || 'Erro ao buscar métricas financeiras');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Resposta inválida do servidor');
      }

      // Atualizar estados com dados do backend (ZERO cálculos locais)
      setMetricas(data.metricas);
      setCobrancas(data.cobrancas || []);
      setRecebimentos(data.recebimentos || []);
      setDespesasFixas(data.despesas_fixas || []);
      setDespesasVariaveis(data.despesas_variaveis || []);
      setImpostos(data.impostos || []);
      setInadimplentes(data.inadimplentes || []);
      setLastCalculatedAt(data.calculated_at);
      setDataSource(data.source);

      console.log('✅ [useFinanceiroData] Dados recebidos do backend', {
        source: data.source,
        calculatedAt: data.calculated_at,
        receita_realizada: data.metricas?.receita_realizada,
        inadimplentes: data.inadimplentes?.length
      });

    } catch (err: any) {
      console.error('❌ [useFinanceiroData] Erro ao buscar dados financeiros:', err);
      setError(err.message || 'Erro desconhecido');
      
      // Reset estados em caso de erro
      setMetricas(null);
      setCobrancas([]);
      setRecebimentos([]);
      setDespesasFixas([]);
      setDespesasVariaveis([]);
      setImpostos([]);
      setInadimplentes([]);
    } finally {
      setLoading(false);
    }
  }, [temPermissaoFinanceira, competenciaAtual]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    // Estados principais
    loading,
    error,
    metricas,
    cobrancas,
    recebimentos,
    despesasFixas,
    despesasVariaveis,
    impostos,
    inadimplentes,
    
    // Metadados
    temPermissaoFinanceira,
    lastCalculatedAt,
    dataSource, // 'backend' confirma que dados vieram do servidor
    
    // Ações
    refetch: fetchData
  };
};
