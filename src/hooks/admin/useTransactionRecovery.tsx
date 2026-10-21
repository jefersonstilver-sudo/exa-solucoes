
import { useState } from 'react';
import { readAsaasAudit } from '@/services/asaasAuditService';
import { toast } from 'sonner';

export interface TransactionInvestigationResult {
  success: boolean;
  email: string;
  amount: number;
  webhook_logs_found: number;
  existing_pedido: string | null;
  new_pedido_created: string | null;
  investigation_timestamp: string;
}

export interface ReconciliationResult {
  reconciliation_date: string;
  supabase_total: number;
  webhook_transactions: number;
  missing_transactions: number;
  lost_revenue_estimate: number;
  discrepancy_detected: boolean;
  reconciliation_status: 'RECONCILED' | 'MINOR_DISCREPANCY' | 'MAJOR_DISCREPANCY';
  timestamp: string;
}

export interface AutoFixResult {
  success: boolean;
  transactions_fixed: number;
  total_recovered: number;
  recovery_timestamp: string;
}

export const useTransactionRecovery = () => {
  const [loading, setLoading] = useState(false);
  const [reconciliationResult, setReconciliationResult] = useState<ReconciliationResult | null>(null);
  const runReconciliationCheck = async () => {
    setLoading(true);
    try {
      const audit = await readAsaasAudit();
      const result: ReconciliationResult = {
        reconciliation_date: audit.timestamp, supabase_total: audit.total,
        webhook_transactions: audit.events.length, missing_transactions: audit.unmatched.length,
        lost_revenue_estimate: 0, discrepancy_detected: audit.unmatched.length > 0,
        reconciliation_status: audit.unmatched.length ? 'MAJOR_DISCREPANCY' : 'MINOR_DISCREPANCY', timestamp: audit.timestamp
      };
      setReconciliationResult(result);
      toast.info('Consulta Asaas concluída; conciliação bancária não certificada');
      return result;
    } finally { setLoading(false); }
  };
  const blocked = async (): Promise<AutoFixResult> => {
    toast.warning('Correções automáticas desativadas. Revise a cobrança pelo identificador Asaas.');
    return { success: false, transactions_fixed: 0, total_recovered: 0, recovery_timestamp: new Date().toISOString() };
  };
  const investigateTransaction = async (_email: string, _amount: number): Promise<TransactionInvestigationResult> => {
    throw new Error('Informe o identificador oficial da cobrança Asaas; nome ou valor não identifica um pagamento');
  };
  return { loading, investigationResult: null, reconciliationResult, autoFixResult: null,
    investigateTransaction, runReconciliationCheck, autoFixLostTransactions: blocked, fixSpecificTransaction: blocked };
};
