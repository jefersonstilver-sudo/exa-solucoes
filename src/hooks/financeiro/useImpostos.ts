import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Imposto, ImpostoPayload } from '@/types/financeiro';

export const useImpostos = () => {
  const [loading, setLoading] = useState(false);
  const [impostos, setImpostos] = useState<Imposto[]>([]);

  const fetchImpostos = useCallback(async (competencia?: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from('impostos')
        .select('*')
        .order('competencia', { ascending: false });

      if (competencia) {
        query = query.eq('competencia', competencia);
      }

      const { data, error } = await query;
      if (error) throw error;

      setImpostos((data || []) as unknown as Imposto[]);
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar impostos:', error);
      toast.error('Erro ao carregar impostos');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const calcularImpostosMes = useCallback(async (competencia?: string) => {
    try {
      const { error } = await supabase.rpc('calcular_impostos_mes', {
        p_competencia: competencia || null
      });
      if (error) throw error;
      toast.success('Impostos calculados');
      return true;
    } catch (error) {
      console.error('Erro ao calcular impostos:', error);
      toast.error('Erro ao calcular impostos');
      return false;
    }
  }, []);

  const createImposto = useCallback(async (payload: ImpostoPayload) => {
    try {
      const { data, error } = await supabase
        .from('impostos')
        .insert({
          ...payload,
          valor_pago: 0,
          pago: false
        })
        .select()
        .single();

      if (error) throw error;
      toast.success('Imposto registrado');
      return data;
    } catch (error) {
      console.error('Erro ao criar imposto:', error);
      toast.error('Erro ao registrar imposto');
      return null;
    }
  }, []);

  const updateImposto = useCallback(async (id: string, updates: Partial<Imposto>) => {
    try {
      const { data, error } = await supabase
        .from('impostos')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      toast.success('Imposto atualizado');
      return data;
    } catch (error) {
      console.error('Erro ao atualizar imposto:', error);
      toast.error('Erro ao atualizar imposto');
      return null;
    }
  }, []);

  const marcarComoPago = useCallback(async (id: string, valorPago: number) => {
    try {
      const { data, error } = await supabase
        .from('impostos')
        .update({ 
          pago: true, 
          valor_pago: valorPago,
          data_pagamento: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      toast.success('Pagamento de imposto registrado');
      return data;
    } catch (error) {
      console.error('Erro ao registrar pagamento de imposto:', error);
      toast.error('Erro ao registrar pagamento');
      return null;
    }
  }, []);

  // Resumo de impostos
  const getResumoImpostos = useCallback(() => {
    const estimado = impostos.reduce((sum, i) => sum + (Number(i.valor_estimado) || 0), 0);
    const pago = impostos.reduce((sum, i) => sum + (Number(i.valor_pago) || 0), 0);
    const pendente = impostos.filter(i => !i.pago).reduce((sum, i) => sum + (Number(i.valor_estimado) || 0), 0);

    return {
      estimado,
      pago,
      pendente,
      count: impostos.length,
      pagoCount: impostos.filter(i => i.pago).length
    };
  }, [impostos]);

  return {
    loading,
    impostos,
    fetchImpostos,
    calcularImpostosMes,
    createImposto,
    updateImposto,
    marcarComoPago,
    getResumoImpostos
  };
};
