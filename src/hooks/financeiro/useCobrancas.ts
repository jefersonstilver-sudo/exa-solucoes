import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Cobranca, CobrancaPayload, StatusCobranca } from '@/types/financeiro';

export const useCobrancas = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([]);

  const fetchCobrancas = useCallback(async (filters?: {
    competencia?: string;
    status?: StatusCobranca;
    client_id?: string;
  }) => {
    setLoading(true);
    try {
      let query = supabase
        .from('cobrancas')
        .select(`
          *,
          users:client_id (
            full_name,
            email,
            phone
          )
        `)
        .order('data_vencimento', { ascending: true });

      if (filters?.competencia) {
        query = query.eq('competencia', filters.competencia);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.client_id) {
        query = query.eq('client_id', filters.client_id);
      }

      const { data, error } = await query;
      if (error) throw error;

      const processed = (data || []).map((c: any) => ({
        ...c,
        cliente_nome: c.users?.full_name || 'Cliente não identificado',
        cliente_email: c.users?.email
      })) as Cobranca[];

      setCobrancas(processed);
      return processed;
    } catch (error) {
      console.error('Erro ao buscar cobranças:', error);
      toast.error('Erro ao carregar cobranças');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createCobranca = useCallback(async (payload: CobrancaPayload) => {
    try {
      const { data, error } = await supabase
        .from('cobrancas')
        .insert({
          ...payload,
          status: 'pendente',
          dias_atraso: 0
        })
        .select()
        .single();

      if (error) throw error;
      toast.success('Cobrança criada com sucesso');
      return data;
    } catch (error) {
      console.error('Erro ao criar cobrança:', error);
      toast.error('Erro ao criar cobrança');
      return null;
    }
  }, []);

  const updateCobranca = useCallback(async (id: string, updates: Partial<Cobranca>) => {
    try {
      const { data, error } = await supabase
        .from('cobrancas')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      toast.success('Cobrança atualizada');
      return data;
    } catch (error) {
      console.error('Erro ao atualizar cobrança:', error);
      toast.error('Erro ao atualizar cobrança');
      return null;
    }
  }, []);

  const marcarComoPago = useCallback(async (id: string, valorPago: number) => {
    try {
      // Atualizar cobrança
      await supabase
        .from('cobrancas')
        .update({ status: 'pago', updated_at: new Date().toISOString() })
        .eq('id', id);

      // Criar recebimento
      const cobranca = cobrancas.find(c => c.id === id);
      if (cobranca) {
        await supabase.from('recebimentos').insert({
          cobranca_id: id,
          client_id: cobranca.client_id,
          valor_pago: valorPago,
          data_pagamento: new Date().toISOString().split('T')[0],
          metodo: 'pix',
          origem: 'manual'
        });
      }

      toast.success('Pagamento registrado');
      return true;
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error);
      toast.error('Erro ao registrar pagamento');
      return false;
    }
  }, [cobrancas]);

  const gerarCobrancasMensais = useCallback(async () => {
    try {
      const { error } = await supabase.rpc('gerar_cobrancas_mensais');
      if (error) throw error;
      toast.success('Cobranças mensais geradas');
      return true;
    } catch (error) {
      console.error('Erro ao gerar cobranças:', error);
      toast.error('Erro ao gerar cobranças mensais');
      return false;
    }
  }, []);

  const atualizarDiasAtraso = useCallback(async () => {
    try {
      const { error } = await supabase.rpc('atualizar_dias_atraso_cobrancas');
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao atualizar dias de atraso:', error);
      return false;
    }
  }, []);

  return {
    loading,
    cobrancas,
    fetchCobrancas,
    createCobranca,
    updateCobranca,
    marcarComoPago,
    gerarCobrancasMensais,
    atualizarDiasAtraso
  };
};
