import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DespesaFixa, DespesaVariavel, DespesaFixaPayload, DespesaVariavelPayload } from '@/types/financeiro';

export const useDespesas = () => {
  const [loading, setLoading] = useState(false);
  const [despesasFixas, setDespesasFixas] = useState<DespesaFixa[]>([]);
  const [despesasVariaveis, setDespesasVariaveis] = useState<DespesaVariavel[]>([]);

  // ===== DESPESAS FIXAS =====
  const fetchDespesasFixas = useCallback(async (apenasAtivas = true) => {
    setLoading(true);
    try {
      let query = supabase
        .from('despesas_fixas')
        .select('*')
        .order('descricao', { ascending: true });

      if (apenasAtivas) {
        query = query.eq('ativo', true);
      }

      const { data, error } = await query;
      if (error) throw error;

      setDespesasFixas((data || []) as unknown as DespesaFixa[]);
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar despesas fixas:', error);
      toast.error('Erro ao carregar despesas fixas');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createDespesaFixa = useCallback(async (payload: DespesaFixaPayload) => {
    try {
      const { data, error } = await supabase
        .from('despesas_fixas')
        .insert({
          ...payload,
          ativo: true,
          dia_vencimento: payload.dia_vencimento || 10
        })
        .select()
        .single();

      if (error) throw error;
      toast.success('Despesa fixa criada');
      return data;
    } catch (error) {
      console.error('Erro ao criar despesa fixa:', error);
      toast.error('Erro ao criar despesa fixa');
      return null;
    }
  }, []);

  const updateDespesaFixa = useCallback(async (id: string, updates: Partial<DespesaFixa>) => {
    try {
      const { data, error } = await supabase
        .from('despesas_fixas')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      toast.success('Despesa fixa atualizada');
      return data;
    } catch (error) {
      console.error('Erro ao atualizar despesa fixa:', error);
      toast.error('Erro ao atualizar despesa fixa');
      return null;
    }
  }, []);

  const toggleDespesaFixa = useCallback(async (id: string, ativo: boolean) => {
    return updateDespesaFixa(id, { ativo });
  }, [updateDespesaFixa]);

  const deleteDespesaFixa = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('despesas_fixas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Despesa fixa removida');
      return true;
    } catch (error) {
      console.error('Erro ao remover despesa fixa:', error);
      toast.error('Erro ao remover despesa fixa');
      return false;
    }
  }, []);

  // ===== DESPESAS VARIÁVEIS =====
  const fetchDespesasVariaveis = useCallback(async (filters?: {
    data_inicio?: string;
    data_fim?: string;
    categoria?: string;
  }) => {
    setLoading(true);
    try {
      let query = supabase
        .from('despesas_variaveis')
        .select('*')
        .order('data', { ascending: false });

      if (filters?.data_inicio) {
        query = query.gte('data', filters.data_inicio);
      }
      if (filters?.data_fim) {
        query = query.lte('data', filters.data_fim);
      }
      if (filters?.categoria) {
        query = query.eq('categoria', filters.categoria);
      }

      const { data, error } = await query;
      if (error) throw error;

      setDespesasVariaveis((data || []) as unknown as DespesaVariavel[]);
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar despesas variáveis:', error);
      toast.error('Erro ao carregar despesas variáveis');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createDespesaVariavel = useCallback(async (payload: DespesaVariavelPayload) => {
    try {
      const { data, error } = await supabase
        .from('despesas_variaveis')
        .insert({
          ...payload,
          pago: payload.pago || false
        })
        .select()
        .single();

      if (error) throw error;
      toast.success('Despesa variável registrada');
      return data;
    } catch (error) {
      console.error('Erro ao criar despesa variável:', error);
      toast.error('Erro ao registrar despesa');
      return null;
    }
  }, []);

  const updateDespesaVariavel = useCallback(async (id: string, updates: Partial<DespesaVariavel>) => {
    try {
      const { data, error } = await supabase
        .from('despesas_variaveis')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      toast.success('Despesa atualizada');
      return data;
    } catch (error) {
      console.error('Erro ao atualizar despesa:', error);
      toast.error('Erro ao atualizar despesa');
      return null;
    }
  }, []);

  const deleteDespesaVariavel = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('despesas_variaveis')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Despesa removida');
      return true;
    } catch (error) {
      console.error('Erro ao remover despesa:', error);
      toast.error('Erro ao remover despesa');
      return false;
    }
  }, []);

  // ===== CATEGORIAS =====
  const [categorias, setCategorias] = useState<any[]>([]);

  const fetchCategorias = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('categorias_despesas')
        .select('*')
        .eq('ativo', true)
        .order('nome', { ascending: true });

      if (error) throw error;
      setCategorias(data || []);
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      return [];
    }
  }, []);

  return {
    loading,
    despesasFixas,
    despesasVariaveis,
    categorias,
    fetchDespesasFixas,
    createDespesaFixa,
    updateDespesaFixa,
    toggleDespesaFixa,
    deleteDespesaFixa,
    fetchDespesasVariaveis,
    createDespesaVariavel,
    updateDespesaVariavel,
    deleteDespesaVariavel,
    fetchCategorias
  };
};
