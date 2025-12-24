import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BalanceData {
  available: number;
  blocked: number;
  to_be_released: number;
  currency: string;
}

interface AccountData {
  id: number;
  nickname: string;
  email: string;
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

interface AuditAlert {
  id: string;
  level: 'critical' | 'warning' | 'info';
  type: string;
  message: string;
  pedido_id: string | null;
  client_name: string | null;
  order_value: number | null;
  mp_value: number | null;
  mp_payer_name: string | null;
}

interface AuditStats {
  total_orders_checked: number;
  validated: number;
  warnings: number;
  critical: number;
  integrity_percentage: number;
}

export const useMercadoPagoFinancial = () => {
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [account, setAccount] = useState<AccountData | null>(null);
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [auditStats, setAuditStats] = useState<AuditStats | null>(null);
  const [auditAlerts, setAuditAlerts] = useState<AuditAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-mercadopago-balance');
      
      if (error) throw error;
      
      setBalance(data.balance);
      setAccount(data.account);
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

  const runAudit = useCallback(async () => {
    setAuditLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('audit-orders-vs-mercadopago');
      
      if (error) throw error;
      
      setAuditStats(data.stats);
      setAuditAlerts(data.alerts || []);
      
      if (data.stats.critical > 0) {
        toast.error(`Encontrados ${data.stats.critical} alertas críticos!`);
      } else if (data.stats.warnings > 0) {
        toast.warning(`${data.stats.warnings} avisos encontrados`);
      } else {
        toast.success('Auditoria concluída sem problemas!');
      }
    } catch (error: any) {
      console.error('Error running audit:', error);
      toast.error('Erro ao executar auditoria');
    } finally {
      setAuditLoading(false);
    }
  }, []);

  return {
    balance,
    account,
    kpis,
    auditStats,
    auditAlerts,
    loading,
    auditLoading,
    lastUpdated,
    fetchBalance,
    runAudit
  };
};
