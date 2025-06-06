
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
  const [investigationResult, setInvestigationResult] = useState<TransactionInvestigationResult | null>(null);
  const [reconciliationResult, setReconciliationResult] = useState<ReconciliationResult | null>(null);
  const [autoFixResult, setAutoFixResult] = useState<AutoFixResult | null>(null);

  const investigateTransaction = async (email: string, amount: number) => {
    try {
      setLoading(true);
      console.log('🔍 Investigating missing transaction:', { email, amount });
      
      const { data, error } = await supabase.rpc('investigate_missing_transaction', {
        p_email: email,
        p_amount: amount
      });

      if (error) {
        console.error('❌ Error investigating transaction:', error);
        throw error;
      }

      console.log('✅ Investigation result:', data);
      const result = data as unknown as TransactionInvestigationResult;
      setInvestigationResult(result);
      
      if (result.new_pedido_created) {
        toast.success(`Transação recuperada! Novo pedido criado: ${result.new_pedido_created}`);
      } else if (result.existing_pedido) {
        toast.info('Pedido já existe no sistema');
      } else {
        toast.warning('Nenhuma ação necessária');
      }

      return result;
    } catch (error) {
      console.error('💥 Error in investigation:', error);
      toast.error('Erro ao investigar transação');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const runReconciliationCheck = async () => {
    try {
      setLoading(true);
      console.log('🔄 Running MercadoPago reconciliation check...');
      
      const { data, error } = await supabase.rpc('mercadopago_reconciliation_check');

      if (error) {
        console.error('❌ Error in reconciliation check:', error);
        throw error;
      }

      console.log('📊 Reconciliation result:', data);
      const result = data as unknown as ReconciliationResult;
      setReconciliationResult(result);
      
      const status = result.reconciliation_status;
      if (status === 'RECONCILED') {
        toast.success('✅ Sistema reconciliado com MercadoPago');
      } else if (status === 'MINOR_DISCREPANCY') {
        toast.warning(`⚠️ Pequena discrepância detectada: ${result.missing_transactions} transações`);
      } else {
        toast.error(`🚨 Discrepância crítica: ${result.missing_transactions} transações perdidas`);
      }

      return result;
    } catch (error) {
      console.error('💥 Error in reconciliation:', error);
      toast.error('Erro na reconciliação');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const autoFixLostTransactions = async () => {
    try {
      setLoading(true);
      console.log('🔧 Running auto-fix for lost transactions...');
      
      const { data, error } = await supabase.rpc('auto_fix_lost_transactions');

      if (error) {
        console.error('❌ Error in auto-fix:', error);
        throw error;
      }

      console.log('🛠️ Auto-fix result:', data);
      const result = data as unknown as AutoFixResult;
      setAutoFixResult(result);
      
      if (result.transactions_fixed > 0) {
        toast.success(`🎉 ${result.transactions_fixed} transações recuperadas automaticamente! Total: R$ ${result.total_recovered.toFixed(2)}`);
      } else {
        toast.info('Nenhuma transação perdida encontrada para correção');
      }

      return result;
    } catch (error) {
      console.error('💥 Error in auto-fix:', error);
      toast.error('Erro na correção automática');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fixSpecificTransaction = async () => {
    // Fix the specific R$0.19 transaction we identified
    return await investigateTransaction('patagoniadafronteira@gmail.com', 0.19);
  };

  return {
    loading,
    investigationResult,
    reconciliationResult,
    autoFixResult,
    investigateTransaction,
    runReconciliationCheck,
    autoFixLostTransactions,
    fixSpecificTransaction
  };
};
