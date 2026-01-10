/**
 * useAlertasFinanceiros - Hook para gestão de alertas financeiros
 * 
 * Consome dados da tabela alertas_financeiros
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export interface AlertaFinanceiro {
  id: string;
  tipo: string;
  nivel: 'info' | 'warning' | 'critical';
  titulo: string;
  mensagem: string;
  entidade_tipo?: string;
  entidade_id?: string;
  valor_referencia?: number;
  data_referencia?: string;
  ativo: boolean;
  resolvido: boolean;
  resolvido_em?: string;
  resolvido_por?: string;
  resolucao_nota?: string;
  notificacao_whatsapp: boolean;
  notificado_em?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export const useAlertasFinanceiros = () => {
  const [alertas, setAlertas] = useState<AlertaFinanceiro[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchAlertas = useCallback(async (filtro?: 'ativos' | 'resolvidos' | 'todos') => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('alertas_financeiros')
        .select('*')
        .order('created_at', { ascending: false });

      if (filtro === 'ativos') {
        query = query.eq('ativo', true).eq('resolvido', false);
      } else if (filtro === 'resolvidos') {
        query = query.eq('resolvido', true);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setAlertas((data || []) as AlertaFinanceiro[]);
    } catch (err: any) {
      console.error('❌ [useAlertasFinanceiros] Erro:', err);
      setError(err.message);
      toast.error('Erro ao carregar alertas financeiros');
    } finally {
      setLoading(false);
    }
  }, []);

  const resolverAlerta = useCallback(async (alertaId: string, nota?: string) => {
    try {
      const { error: updateError } = await supabase
        .from('alertas_financeiros')
        .update({
          resolvido: true,
          resolvido_em: new Date().toISOString(),
          resolvido_por: user?.id,
          resolucao_nota: nota,
          ativo: false
        })
        .eq('id', alertaId);

      if (updateError) throw updateError;

      // Atualizar lista local
      setAlertas(prev => prev.map(a => 
        a.id === alertaId 
          ? { ...a, resolvido: true, ativo: false, resolucao_nota: nota }
          : a
      ));

      toast.success('Alerta resolvido com sucesso');
      return true;
    } catch (err: any) {
      console.error('❌ [useAlertasFinanceiros] Erro ao resolver:', err);
      toast.error('Erro ao resolver alerta');
      return false;
    }
  }, [user?.id]);

  const ignorarAlerta = useCallback(async (alertaId: string, justificativa: string) => {
    try {
      const { error: updateError } = await supabase
        .from('alertas_financeiros')
        .update({
          ativo: false,
          resolucao_nota: `IGNORADO: ${justificativa}`,
          resolvido_por: user?.id
        })
        .eq('id', alertaId);

      if (updateError) throw updateError;

      setAlertas(prev => prev.map(a => 
        a.id === alertaId 
          ? { ...a, ativo: false }
          : a
      ));

      toast.success('Alerta ignorado');
      return true;
    } catch (err: any) {
      console.error('❌ [useAlertasFinanceiros] Erro ao ignorar:', err);
      toast.error('Erro ao ignorar alerta');
      return false;
    }
  }, [user?.id]);

  // Contadores
  const contadores = {
    ativos: alertas.filter(a => a.ativo && !a.resolvido).length,
    resolvidos: alertas.filter(a => a.resolvido).length,
    criticos: alertas.filter(a => a.ativo && !a.resolvido && a.nivel === 'critical').length,
    warnings: alertas.filter(a => a.ativo && !a.resolvido && a.nivel === 'warning').length
  };

  return {
    alertas,
    loading,
    error,
    contadores,
    fetchAlertas,
    resolverAlerta,
    ignorarAlerta
  };
};
