import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ContactScoringRule, ContactScoringConfig } from '@/types/contatos';

export const useScoringRules = () => {
  const [rules, setRules] = useState<ContactScoringRule[]>([]);
  const [configs, setConfigs] = useState<ContactScoringConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRules = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('contact_scoring_rules')
        .select('*')
        .order('ordem', { ascending: true });

      if (error) throw error;
      setRules((data as ContactScoringRule[]) || []);
    } catch (error) {
      console.error('Erro ao buscar regras:', error);
    }
  }, []);

  const fetchConfigs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('contact_scoring_config')
        .select('*');

      if (error) throw error;
      setConfigs((data as ContactScoringConfig[]) || []);
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchRules(), fetchConfigs()]);
    setLoading(false);
  }, [fetchRules, fetchConfigs]);

  const updateRule = async (id: string, updates: Partial<ContactScoringRule>) => {
    try {
      const { error } = await supabase
        .from('contact_scoring_rules')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      toast.success('Regra atualizada');
      fetchRules();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar regra');
    }
  };

  const updateConfig = async (id: string, updates: Partial<ContactScoringConfig>) => {
    try {
      const { error } = await supabase
        .from('contact_scoring_config')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      toast.success('Configuração atualizada');
      fetchConfigs();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar configuração');
    }
  };

  const getMaxScore = useCallback(() => {
    return rules.filter(r => r.ativo).reduce((sum, r) => sum + r.pontos, 0);
  }, [rules]);

  const getConfigForCategory = useCallback((categoria: string) => {
    return configs.find(c => c.categoria === categoria);
  }, [configs]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    rules,
    configs,
    loading,
    fetchAll,
    updateRule,
    updateConfig,
    getMaxScore,
    getConfigForCategory
  };
};
