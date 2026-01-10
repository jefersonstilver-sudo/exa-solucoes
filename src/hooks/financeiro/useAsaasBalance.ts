import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AsaasBalanceData {
  available: number;
  blocked: number;
  to_be_released: number;
  currency: string;
  source: 'asaas' | 'unavailable' | 'error';
}

interface AsaasSummary30d {
  total_received: number;
  received_count: number;
  total_pending: number;
  pending_count: number;
  total_overdue: number;
  overdue_count: number;
}

export const useAsaasBalance = () => {
  const [balance, setBalance] = useState<AsaasBalanceData | null>(null);
  const [summary, setSummary] = useState<AsaasSummary30d | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-asaas-balance');
      
      if (error) throw error;
      
      console.log('💰 [useAsaasBalance] Resposta:', data);
      
      if (data.balance) {
        setBalance({
          available: data.balance.available || 0,
          blocked: data.balance.blocked || 0,
          to_be_released: data.balance.to_be_released || 0,
          currency: data.balance.currency || 'BRL',
          source: data.balance.source || 'asaas'
        });
      } else {
        setBalance({
          available: 0,
          blocked: 0,
          to_be_released: 0,
          currency: 'BRL',
          source: 'unavailable'
        });
      }
      
      if (data.summary_30d) {
        setSummary(data.summary_30d);
      }
      
      setLastUpdated(data.last_updated);
      
    } catch (error: any) {
      console.error('❌ [useAsaasBalance] Erro:', error);
      toast.error('Erro ao buscar saldo do Asaas');
      setBalance({
        available: 0,
        blocked: 0,
        to_be_released: 0,
        currency: 'BRL',
        source: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    balance,
    summary,
    loading,
    lastUpdated,
    fetchBalance
  };
};
