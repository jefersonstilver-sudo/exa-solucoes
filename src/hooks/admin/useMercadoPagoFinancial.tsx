import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BalanceData {
  available: number;
  blocked: number;
  to_be_released: number;
  currency: string;
  source?: 'api' | 'unavailable' | 'error';
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

// Interface alinhada com campos REAIS do Mercado Pago
interface PaymentData {
  id: number;
  external_reference: string | null;
  date_created: string;
  date_approved: string | null;
  money_release_date: string | null;
  status: string;
  status_detail: string;
  transaction_amount: number;
  net_received_amount: number;
  total_paid_amount: number;
  fee_amount: number;
  currency_id: string;
  payment_method_id: string;
  payment_type_id: string;
  issuer_id: string | null;
  installments: number;
  payer: {
    id: string | null;
    email: string | null;
    first_name: string | null;
    last_name: string | null;
    identification: any;
    phone: any;
  };
  payer_name: string;
  payer_email: string | null;
  description: string | null;
  card: any;
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
      
      console.log('📊 [Hook] Resposta do balance:', data);
      
      // Processar saldo - pode ser null se não disponível
      if (data.balance) {
        setBalance({
          available: data.balance.available || 0,
          blocked: data.balance.blocked || 0,
          to_be_released: data.balance.to_be_released || 0,
          currency: data.balance.currency || 'BRL',
          source: data.balance_source || 'api'
        });
      } else {
        // Saldo não disponível via API
        setBalance({
          available: 0,
          blocked: 0,
          to_be_released: 0,
          currency: 'BRL',
          source: data.balance_source === 'error' ? 'error' : 'unavailable'
        });
      }
      
      setLastUpdated(data.last_updated);
      
      // KPIs reais dos últimos 30 dias
      if (data.summary_30d) {
        const summary = data.summary_30d;
        setKpis({
          revenue_30d: summary.total_received || 0,
          avg_ticket: summary.payments_count > 0 
            ? summary.total_received / summary.payments_count 
            : 0,
          mp_fees: summary.fees_paid || 0,
          refunds: 0, // Precisaria buscar separadamente
          chargebacks: 0, // Precisaria buscar separadamente
          net_margin: summary.net_received || 0,
          payments_count: summary.payments_count || 0
        });
      }
    } catch (error: any) {
      console.error('❌ [Hook] Erro ao buscar saldo:', error);
      toast.error('Erro ao buscar saldo do Mercado Pago');
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
          status: params?.status, // null busca todos os status
          limit: params?.limit || 50,
          date_from: params?.date_from,
          date_to: params?.date_to
        }
      });
      
      if (error) throw error;
      
      console.log('📊 [Hook] Resposta payments:', {
        count: data.payments?.length,
        summary: data.summary,
        source: data.source
      });
      
      if (data.payments && Array.isArray(data.payments)) {
        setPayments(data.payments);
      } else {
        setPayments([]);
      }
    } catch (error: any) {
      console.error('❌ [Hook] Erro ao buscar pagamentos:', error);
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
