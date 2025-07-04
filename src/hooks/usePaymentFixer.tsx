
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PaymentFixResult {
  success: boolean;
  message: string;
  pedido_id?: string;
  novo_status?: string;
  transaction_id?: string;
  valor_total?: number;
}

interface ReconciliationResult {
  success: boolean;
  processed_orders: number;
  total_pending: number;
  errors: string[];
  timestamp: string;
}

export const usePaymentFixer = () => {
  const [isFixing, setIsFixing] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);

  const fixCurrentPayment = async (): Promise<PaymentFixResult> => {
    setIsFixing(true);
    
    try {
      console.log('🔧 [PAYMENT_FIXER] Iniciando correção manual do pagamento');

      const { data, error } = await supabase.functions.invoke('fix-current-payment');

      if (error) {
        throw error;
      }

      const result = data as PaymentFixResult;
      
      if (result.success) {
        toast.success(`✅ Pagamento corrigido! Pedido ${result.pedido_id} atualizado para ${result.novo_status}`);
        console.log('✅ [PAYMENT_FIXER] Pagamento corrigido com sucesso:', result);
      } else {
        toast.error(`❌ Erro na correção: ${result.message}`);
      }

      return result;

    } catch (error: any) {
      console.error('❌ [PAYMENT_FIXER] Erro na correção:', error);
      const errorMessage = error.message || 'Erro desconhecido na correção';
      toast.error(`Erro na correção: ${errorMessage}`);
      
      return {
        success: false,
        message: errorMessage
      };
    } finally {
      setIsFixing(false);
    }
  };

  const runAutoReconciliation = async (): Promise<ReconciliationResult> => {
    setIsReconciling(true);
    
    try {
      console.log('🔄 [PAYMENT_FIXER] Iniciando reconciliação automática');

      const { data, error } = await supabase.functions.invoke('auto-payment-reconciliation');

      if (error) {
        throw error;
      }

      const result = data as ReconciliationResult;
      
      if (result.success) {
        if (result.processed_orders > 0) {
          toast.success(`✅ Reconciliação concluída! ${result.processed_orders} pagamentos processados`);
        } else {
          toast.info('ℹ️ Reconciliação concluída - Nenhum pagamento pendente encontrado');
        }
        
        console.log('✅ [PAYMENT_FIXER] Reconciliação automática concluída:', result);
      } else {
        toast.error('❌ Erro na reconciliação automática');
      }

      return result;

    } catch (error: any) {
      console.error('❌ [PAYMENT_FIXER] Erro na reconciliação:', error);
      const errorMessage = error.message || 'Erro desconhecido na reconciliação';
      toast.error(`Erro na reconciliação: ${errorMessage}`);
      
      return {
        success: false,
        processed_orders: 0,
        total_pending: 0,
        errors: [errorMessage],
        timestamp: new Date().toISOString()
      };
    } finally {
      setIsReconciling(false);
    }
  };

  return {
    fixCurrentPayment,
    runAutoReconciliation,
    isFixing,
    isReconciling
  };
};
