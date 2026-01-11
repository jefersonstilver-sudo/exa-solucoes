/**
 * useAssinaturasOperacionais - Hook para gestão de assinaturas SaaS/ferramentas
 * 
 * Consome dados da tabela assinaturas_operacionais
 * Parcelas são geradas automaticamente pelo CRON unificado
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export interface AssinaturaOperacional {
  id: string;
  nome: string;
  descricao?: string;
  fornecedor_id?: string;
  fornecedor_nome?: string;
  valor: number;
  moeda: string;
  periodicidade: 'mensal' | 'trimestral' | 'semestral' | 'anual';
  data_inicio: string;
  data_proximo_vencimento: string;
  dia_vencimento: number;
  categoria_id?: string;
  subcategoria_id?: string;
  ativo: boolean;
  status_operacional: 'normal' | 'atencao' | 'em_risco' | 'suspensa' | 'cancelada';
  nivel_criticidade: 'baixo' | 'medio' | 'alto' | 'critico';
  impacto_descricao: string;
  sistemas_afetados: string[];
  tempo_tolerancia_horas: number;
  responsavel_id?: string;
  responsavel_email?: string;
  url_acesso?: string;
  created_at: string;
  updated_at: string;
}

export interface NovaAssinatura {
  nome: string;
  descricao?: string;
  fornecedor_id?: string;
  fornecedor_nome?: string;
  valor: number;
  moeda?: string;
  periodicidade: 'mensal' | 'trimestral' | 'semestral' | 'anual';
  data_inicio: string;
  data_proximo_vencimento: string;
  dia_vencimento?: number;
  categoria_id?: string;
  subcategoria_id?: string;
  nivel_criticidade: 'baixo' | 'medio' | 'alto' | 'critico';
  impacto_descricao: string;
  sistemas_afetados?: string[];
  tempo_tolerancia_horas?: number;
  responsavel_id?: string;
  responsavel_email?: string;
  url_acesso?: string;
}

export const useAssinaturasOperacionais = () => {
  const [assinaturas, setAssinaturas] = useState<AssinaturaOperacional[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchAssinaturas = useCallback(async (filtro?: 'ativas' | 'inativas' | 'todas') => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('assinaturas_operacionais')
        .select('*')
        .order('nivel_criticidade', { ascending: false })
        .order('data_proximo_vencimento', { ascending: true });

      if (filtro === 'ativas') {
        query = query.eq('ativo', true);
      } else if (filtro === 'inativas') {
        query = query.eq('ativo', false);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setAssinaturas((data || []) as AssinaturaOperacional[]);
    } catch (err: any) {
      console.error('❌ [useAssinaturasOperacionais] Erro:', err);
      setError(err.message);
      toast.error('Erro ao carregar assinaturas');
    } finally {
      setLoading(false);
    }
  }, []);

  const criarAssinatura = useCallback(async (dados: NovaAssinatura): Promise<string | null> => {
    try {
      const { data, error: insertError } = await supabase
        .from('assinaturas_operacionais')
        .insert({
          ...dados,
          created_by: user?.id,
          moeda: dados.moeda || 'BRL',
          dia_vencimento: dados.dia_vencimento || 10,
          sistemas_afetados: dados.sistemas_afetados || [],
          tempo_tolerancia_horas: dados.tempo_tolerancia_horas || 24,
        })
        .select('id')
        .single();

      if (insertError) throw insertError;

      toast.success(`Assinatura "${dados.nome}" criada com sucesso`);
      await fetchAssinaturas('ativas');
      return data.id;
    } catch (err: any) {
      console.error('❌ [useAssinaturasOperacionais] Erro ao criar:', err);
      toast.error('Erro ao criar assinatura');
      return null;
    }
  }, [user?.id, fetchAssinaturas]);

  const atualizarAssinatura = useCallback(async (
    id: string, 
    dados: Partial<NovaAssinatura>,
    motivo?: string
  ): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('assinaturas_operacionais')
        .update({
          ...dados,
          updated_by: user?.id,
          motivo_alteracao: motivo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;

      setAssinaturas(prev => prev.map(a => 
        a.id === id ? { ...a, ...dados } : a
      ));

      toast.success('Assinatura atualizada');
      return true;
    } catch (err: any) {
      console.error('❌ [useAssinaturasOperacionais] Erro ao atualizar:', err);
      toast.error('Erro ao atualizar assinatura');
      return false;
    }
  }, [user?.id]);

  const desativarAssinatura = useCallback(async (id: string, motivo: string): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('assinaturas_operacionais')
        .update({
          ativo: false,
          status_operacional: 'cancelada',
          motivo_alteracao: `DESATIVADA: ${motivo}`,
          updated_by: user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;

      setAssinaturas(prev => prev.map(a => 
        a.id === id ? { ...a, ativo: false, status_operacional: 'cancelada' as const } : a
      ));

      toast.success('Assinatura desativada');
      return true;
    } catch (err: any) {
      console.error('❌ [useAssinaturasOperacionais] Erro ao desativar:', err);
      toast.error('Erro ao desativar assinatura');
      return false;
    }
  }, [user?.id]);

  const reativarAssinatura = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('assinaturas_operacionais')
        .update({
          ativo: true,
          status_operacional: 'normal',
          motivo_alteracao: 'REATIVADA',
          updated_by: user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;

      setAssinaturas(prev => prev.map(a => 
        a.id === id ? { ...a, ativo: true, status_operacional: 'normal' as const } : a
      ));

      toast.success('Assinatura reativada');
      return true;
    } catch (err: any) {
      console.error('❌ [useAssinaturasOperacionais] Erro ao reativar:', err);
      toast.error('Erro ao reativar assinatura');
      return false;
    }
  }, [user?.id]);

  // Métricas
  const metricas = {
    total: assinaturas.length,
    ativas: assinaturas.filter(a => a.ativo).length,
    criticas: assinaturas.filter(a => a.ativo && a.nivel_criticidade === 'critico').length,
    em_risco: assinaturas.filter(a => a.ativo && ['em_risco', 'suspensa'].includes(a.status_operacional)).length,
    valor_mensal_total: assinaturas
      .filter(a => a.ativo)
      .reduce((acc, a) => {
        if (a.periodicidade === 'mensal') return acc + a.valor;
        if (a.periodicidade === 'trimestral') return acc + (a.valor / 3);
        if (a.periodicidade === 'semestral') return acc + (a.valor / 6);
        if (a.periodicidade === 'anual') return acc + (a.valor / 12);
        return acc;
      }, 0),
  };

  return {
    assinaturas,
    loading,
    error,
    metricas,
    fetchAssinaturas,
    criarAssinatura,
    atualizarAssinatura,
    desativarAssinatura,
    reativarAssinatura,
  };
};
