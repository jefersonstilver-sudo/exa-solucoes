/**
 * useInvestimentos - Hook para gestão de investimentos (CAPEX)
 * 
 * CRUD para tabela investimentos + retornos + métricas ROI/Payback
 */

import { useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export type InvestimentoTipo = 'capex' | 'infraestrutura' | 'marketing' | 'tecnologia' | 'outros';
export type InvestimentoStatus = 'planejado' | 'em_execucao' | 'concluido' | 'cancelado';
export type RetornoCategoria = 'dividendo' | 'juros' | 'venda_ativo' | 'operacional' | 'outro';

export interface Investimento {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  categoria_id?: string;
  tipo?: InvestimentoTipo;
  building_id?: string;
  fornecedor_id?: string;
  previsao_retorno?: string;
  retorno_esperado?: number;
  status?: InvestimentoStatus;
  comprovante_url?: string;
  observacao?: string;
  created_by?: string;
  updated_by?: string;
  motivo_alteracao?: string;
  created_at: string;
  updated_at: string;
  // Novos campos
  centro_custo_id?: string;
  investidor_id?: string;
  investidor_nome?: string;
  roi_realizado?: number;
  payback_meses?: number;
  data_payback?: string;
  retorno_acumulado?: number;
  // Join para centro de custo
  centros_custo?: { nome: string; codigo: string } | null;
}

export interface RetornoInvestimento {
  id: string;
  investimento_id: string;
  descricao: string;
  valor: number;
  data: string;
  categoria?: RetornoCategoria;
  comprovante_url?: string;
  observacao?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface NovoInvestimento {
  descricao: string;
  valor: number;
  data: string;
  categoria_id?: string;
  tipo?: InvestimentoTipo;
  building_id?: string;
  fornecedor_id?: string;
  previsao_retorno?: string;
  retorno_esperado?: number;
  observacao?: string;
  centro_custo_id?: string;
  investidor_id?: string;
  investidor_nome?: string;
}

export interface NovoRetorno {
  investimento_id: string;
  descricao: string;
  valor: number;
  data: string;
  categoria?: RetornoCategoria;
  observacao?: string;
}

export interface CentroCusto {
  id: string;
  codigo: string;
  nome: string;
  departamento?: string;
  orcamento_mensal?: number;
  ativo: boolean;
}

export const useInvestimentos = () => {
  const [investimentos, setInvestimentos] = useState<Investimento[]>([]);
  const [retornos, setRetornos] = useState<RetornoInvestimento[]>([]);
  const [centrosCusto, setCentrosCusto] = useState<CentroCusto[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingRetornos, setLoadingRetornos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchInvestimentos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('investimentos')
        .select(`
          *,
          centros_custo:centro_custo_id (nome, codigo)
        `)
        .order('data', { ascending: false });

      if (fetchError) throw fetchError;

      setInvestimentos((data || []) as Investimento[]);
    } catch (err: any) {
      console.error('❌ [useInvestimentos] Erro:', err);
      setError(err.message);
      toast.error('Erro ao carregar investimentos');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRetornosPorInvestimento = useCallback(async (investimentoId: string) => {
    setLoadingRetornos(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('retornos_investimento')
        .select('*')
        .eq('investimento_id', investimentoId)
        .order('data', { ascending: false });

      if (fetchError) throw fetchError;

      setRetornos((data || []) as RetornoInvestimento[]);
      return (data || []) as RetornoInvestimento[];
    } catch (err: any) {
      console.error('❌ [useInvestimentos] Erro ao buscar retornos:', err);
      toast.error('Erro ao carregar retornos');
      return [];
    } finally {
      setLoadingRetornos(false);
    }
  }, []);

  const fetchCentrosCusto = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('centros_custo')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (fetchError) throw fetchError;

      setCentrosCusto(data || []);
      return data || [];
    } catch (err: any) {
      console.error('❌ [useInvestimentos] Erro ao buscar centros de custo:', err);
      return [];
    }
  }, []);

  const criarInvestimento = useCallback(async (investimento: NovoInvestimento) => {
    try {
      const payload: any = {
        ...investimento,
        status: 'planejado',
        created_by: user?.id
      };

      const { data, error: insertError } = await supabase
        .from('investimentos')
        .insert([payload])
        .select(`
          *,
          centros_custo:centro_custo_id (nome, codigo)
        `)
        .single();

      if (insertError) throw insertError;

      setInvestimentos(prev => [data as Investimento, ...prev]);
      toast.success('Investimento registrado com sucesso');
      return data;
    } catch (err: any) {
      console.error('❌ [useInvestimentos] Erro ao criar:', err);
      toast.error('Erro ao registrar investimento');
      return null;
    }
  }, [user?.id]);

  const atualizarInvestimento = useCallback(async (
    id: string, 
    updates: Partial<Omit<Investimento, 'id' | 'created_at' | 'updated_at'>>, 
    motivo?: string
  ) => {
    try {
      const { error: updateError } = await supabase
        .from('investimentos')
        .update({
          ...updates,
          updated_by: user?.id,
          motivo_alteracao: motivo
        } as any)
        .eq('id', id);

      if (updateError) throw updateError;

      // Recarregar para obter dados atualizados incluindo métricas
      await fetchInvestimentos();
      toast.success('Investimento atualizado');
      return true;
    } catch (err: any) {
      console.error('❌ [useInvestimentos] Erro ao atualizar:', err);
      toast.error('Erro ao atualizar investimento');
      return false;
    }
  }, [user?.id, fetchInvestimentos]);

  const registrarRetorno = useCallback(async (retorno: NovoRetorno) => {
    try {
      const { data, error: insertError } = await supabase
        .from('retornos_investimento')
        .insert([{
          ...retorno,
          created_by: user?.id
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      // Trigger irá recalcular métricas automaticamente
      // Recarregar investimentos para pegar valores atualizados
      await fetchInvestimentos();
      
      toast.success('Retorno registrado com sucesso');
      return data;
    } catch (err: any) {
      console.error('❌ [useInvestimentos] Erro ao registrar retorno:', err);
      toast.error('Erro ao registrar retorno');
      return null;
    }
  }, [user?.id, fetchInvestimentos]);

  const excluirRetorno = useCallback(async (retornoId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('retornos_investimento')
        .delete()
        .eq('id', retornoId);

      if (deleteError) throw deleteError;

      setRetornos(prev => prev.filter(r => r.id !== retornoId));
      await fetchInvestimentos(); // Atualizar métricas
      toast.success('Retorno excluído');
      return true;
    } catch (err: any) {
      console.error('❌ [useInvestimentos] Erro ao excluir retorno:', err);
      toast.error('Erro ao excluir retorno');
      return false;
    }
  }, [fetchInvestimentos]);

  const criarCentroCusto = useCallback(async (nome: string, codigo?: string) => {
    try {
      const codigoFinal = codigo || nome.substring(0, 4).toUpperCase();
      
      const { data, error: insertError } = await supabase
        .from('centros_custo')
        .insert([{
          nome,
          codigo: codigoFinal,
          departamento: 'Financeiro',
          ativo: true
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      setCentrosCusto(prev => [...prev, data]);
      toast.success('Centro de custo criado');
      return data;
    } catch (err: any) {
      console.error('❌ [useInvestimentos] Erro ao criar centro de custo:', err);
      toast.error('Erro ao criar centro de custo');
      return null;
    }
  }, []);

  // Métricas calculadas
  const metricas = useMemo(() => {
    const total = investimentos.reduce((acc, inv) => acc + inv.valor, 0);
    const planejado = investimentos.filter(i => i.status === 'planejado').reduce((acc, inv) => acc + inv.valor, 0);
    const emExecucao = investimentos.filter(i => i.status === 'em_execucao').reduce((acc, inv) => acc + inv.valor, 0);
    const concluido = investimentos.filter(i => i.status === 'concluido').reduce((acc, inv) => acc + inv.valor, 0);
    const retornoEsperado = investimentos.reduce((acc, inv) => acc + (inv.retorno_esperado || 0), 0);
    const retornoAcumulado = investimentos.reduce((acc, inv) => acc + (inv.retorno_acumulado || 0), 0);
    
    // ROI médio ponderado (apenas investimentos com retorno)
    const investimentosComRetorno = investimentos.filter(i => (i.roi_realizado || 0) !== 0);
    const roiMedio = investimentosComRetorno.length > 0
      ? investimentosComRetorno.reduce((acc, inv) => acc + (inv.roi_realizado || 0), 0) / investimentosComRetorno.length
      : 0;
    
    // Payback médio (apenas investimentos com payback calculado)
    const investimentosComPayback = investimentos.filter(i => i.payback_meses && i.payback_meses > 0);
    const paybackMedio = investimentosComPayback.length > 0
      ? Math.round(investimentosComPayback.reduce((acc, inv) => acc + (inv.payback_meses || 0), 0) / investimentosComPayback.length)
      : null;
    
    // Quantos atingiram payback
    const atingiramPayback = investimentos.filter(i => i.data_payback).length;

    return {
      total,
      planejado,
      emExecucao,
      concluido,
      retornoEsperado,
      retornoAcumulado,
      roiMedio,
      paybackMedio,
      atingiramPayback,
      totalInvestimentos: investimentos.length
    };
  }, [investimentos]);

  // Compatibilidade com versão anterior
  const totais = {
    total: metricas.total,
    planejado: metricas.planejado,
    emExecucao: metricas.emExecucao,
    concluido: metricas.concluido,
    retornoEsperado: metricas.retornoEsperado
  };

  return {
    investimentos,
    retornos,
    centrosCusto,
    loading,
    loadingRetornos,
    error,
    totais,
    metricas,
    fetchInvestimentos,
    fetchRetornosPorInvestimento,
    fetchCentrosCusto,
    criarInvestimento,
    atualizarInvestimento,
    registrarRetorno,
    excluirRetorno,
    criarCentroCusto
  };
};
