/**
 * useInvestimentos - Hook para gestão de investimentos (CAPEX)
 * 
 * CRUD para tabela investimentos
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export interface Investimento {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  categoria_id?: string;
  tipo?: string;
  building_id?: string;
  fornecedor_id?: string;
  previsao_retorno?: string;
  retorno_esperado?: number;
  status?: 'planejado' | 'em_execucao' | 'concluido' | 'cancelado';
  comprovante_url?: string;
  observacao?: string;
  created_by?: string;
  updated_by?: string;
  motivo_alteracao?: string;
  created_at: string;
  updated_at: string;
}

export interface NovoInvestimento {
  descricao: string;
  valor: number;
  data: string;
  categoria_id?: string;
  tipo?: string;
  building_id?: string;
  fornecedor_id?: string;
  previsao_retorno?: string;
  retorno_esperado?: number;
  observacao?: string;
}

export const useInvestimentos = () => {
  const [investimentos, setInvestimentos] = useState<Investimento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchInvestimentos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('investimentos')
        .select('*')
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

  const criarInvestimento = useCallback(async (investimento: NovoInvestimento) => {
    try {
      const { data, error: insertError } = await supabase
        .from('investimentos')
        .insert({
          ...investimento,
          created_by: user?.id
        })
        .select()
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

  const atualizarInvestimento = useCallback(async (id: string, updates: Partial<Omit<Investimento, 'id' | 'created_at' | 'updated_at'>>, motivo?: string) => {
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

      setInvestimentos(prev => prev.map(inv => 
        inv.id === id ? { ...inv, ...updates } : inv
      ));

      toast.success('Investimento atualizado');
      return true;
    } catch (err: any) {
      console.error('❌ [useInvestimentos] Erro ao atualizar:', err);
      toast.error('Erro ao atualizar investimento');
      return false;
    }
  }, [user?.id]);

  // Totais
  const totais = {
    total: investimentos.reduce((acc, inv) => acc + inv.valor, 0),
    planejado: investimentos.filter(i => i.status === 'planejado').reduce((acc, inv) => acc + inv.valor, 0),
    emAndamento: investimentos.filter(i => i.status === 'em_andamento').reduce((acc, inv) => acc + inv.valor, 0),
    concluido: investimentos.filter(i => i.status === 'concluido').reduce((acc, inv) => acc + inv.valor, 0),
    retornoEsperado: investimentos.reduce((acc, inv) => acc + (inv.retorno_esperado || 0), 0)
  };

  return {
    investimentos,
    loading,
    error,
    totais,
    fetchInvestimentos,
    criarInvestimento,
    atualizarInvestimento
  };
};
