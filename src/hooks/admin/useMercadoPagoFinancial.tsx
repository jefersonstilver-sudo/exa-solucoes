import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BalanceData {
  available: number;
  blocked: number;
  to_be_released: number;
  currency: string;
  source?: 'api' | 'calculated' | 'unavailable';
}

interface KPIData {
  revenue_30d: number;
  avg_ticket: number;
  mp_fees: number;
  refunds: number;
  chargebacks: number;
  net_margin: number;
  payments_count: number;
}

interface PayerInfo {
  id?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  identification?: {
    type?: string;
    number?: string;
  };
}

interface PaymentData {
  id: number;
  date_created: string;
  date_approved?: string;
  status: string;
  status_detail?: string;
  payment_type_id: string;
  payment_method_id?: string;
  transaction_amount: number;
  net_received_amount?: number;
  fee_amount?: number;
  external_reference?: string;
  payer?: PayerInfo;
  description?: string;
}

export const useMercadoPagoFinancial = () => {
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-mercadopago-balance');
      
      if (error) throw error;
      
      if (data.balance) {
        setBalance({
          ...data.balance,
          source: data.balance_source || 'calculated'
        });
      }
      
      setLastUpdated(data.last_updated);
      
      // Calculate KPIs from summary
      if (data.summary_30d) {
        setKpis({
          revenue_30d: data.summary_30d.total_received || 0,
          avg_ticket: data.summary_30d.payments_count > 0 
            ? data.summary_30d.total_received / data.summary_30d.payments_count 
            : 0,
          mp_fees: data.summary_30d.fees_paid || 0,
          refunds: 0,
          chargebacks: 0,
          net_margin: data.summary_30d.net_received || 0,
          payments_count: data.summary_30d.payments_count || 0
        });
      }
    } catch (error: any) {
      console.error('Error fetching balance:', error);
      toast.error('Erro ao buscar saldo do Mercado Pago');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPayments = useCallback(async (params?: {
    status?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
  }) => {
    setPaymentsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('search-mercadopago-payments', {
        body: {
          status: params?.status || 'approved',
          limit: params?.limit || 50,
          date_from: params?.date_from,
          date_to: params?.date_to
        }
      });
      
      if (error) throw error;
      
      if (data.payments && Array.isArray(data.payments)) {
        setPayments(data.payments);
      } else {
        setPayments([]);
      }
    } catch (error: any) {
      console.error('Error fetching payments:', error);
      toast.error('Erro ao buscar pagamentos do Mercado Pago');
      setPayments([]);
    } finally {
      setPaymentsLoading(false);
    }
  }, []);

  return {
    balance,
    kpis,
    payments,
    loading,
    paymentsLoading,
    lastUpdated,
    fetchBalance,
    fetchPayments
  };
};
