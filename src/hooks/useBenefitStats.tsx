import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BenefitStats {
  total_benefits: number;
  pending_count: number;
  choice_made_count: number;
  code_sent_count: number;
  cancelled_count: number;
  requires_action_count: number;
  month_year: string;
}

export const useBenefitStats = () => {
  const [stats, setStats] = useState<BenefitStats>({
    total_benefits: 0,
    pending_count: 0,
    choice_made_count: 0,
    code_sent_count: 0,
    cancelled_count: 0,
    requires_action_count: 0,
    month_year: '',
  });
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const fetchBenefitStats = async (monthStr: string) => {
    try {
      setLoading(true);
      const [year, month] = monthStr.split('-').map(Number);

      const { data, error } = await supabase.rpc('get_provider_benefits_stats_by_month', {
        p_year: year,
        p_month: month,
      });

      if (error) throw error;

      if (data) {
        // Parse the JSON response from RPC
        const parsedStats = typeof data === 'string' ? JSON.parse(data) : data;
        setStats(parsedStats as BenefitStats);
      }
    } catch (error: any) {
      console.error('Erro ao buscar estatísticas:', error);
      toast.error('Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    fetchBenefitStats(month);
  };

  useEffect(() => {
    fetchBenefitStats(selectedMonth);
  }, []);

  return {
    stats,
    loading,
    selectedMonth,
    handleMonthChange,
  };
};
