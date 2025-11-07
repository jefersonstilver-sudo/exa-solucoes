import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { BenefitOption } from '@/types/providerBenefits';

export const useBenefitOptions = () => {
  const [benefits, setBenefits] = useState<BenefitOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBenefits = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('available_benefits')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (fetchError) throw fetchError;

      setBenefits((data || []) as BenefitOption[]);
      
      console.log('🎁 Benefícios carregados do banco:', data?.length || 0);
    } catch (err: any) {
      console.error('❌ Erro ao carregar benefícios:', err);
      setError(err.message || 'Erro ao carregar benefícios');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBenefits();

    // Setup realtime subscription para atualizações
    const channel = supabase
      .channel('available_benefits_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'available_benefits',
        },
        (payload) => {
          console.log('🔄 Mudança detectada em available_benefits:', payload);
          loadBenefits(); // Recarrega quando houver mudanças
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    benefits,
    isLoading,
    error,
    refresh: loadBenefits,
  };
};
