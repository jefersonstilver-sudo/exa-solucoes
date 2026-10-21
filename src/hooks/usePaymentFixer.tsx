
import { useState } from 'react';
import { readAsaasAudit } from '@/services/asaasAuditService';
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
  const [isReconciling, setIsReconciling] = useState(false);
  const fixCurrentPayment = async (): Promise<PaymentFixResult> => {
    const message = 'Selecione uma cobrança pelo ID Asaas para confirmar manualmente; correções por aproximação permanecem desativadas';
    toast.warning(message); return { success: false, message };
  };
  const runAutoReconciliation = async (): Promise<ReconciliationResult> => {
    setIsReconciling(true);
    try {
      const audit = await readAsaasAudit();
      toast.info('Consulta Asaas concluída. Nenhuma baixa automática.');
      return { success: true, processed_orders: 0, total_pending: audit.unmatched.length, errors: [], timestamp: audit.timestamp };
    } catch (e) { return { success: false, processed_orders: 0, total_pending: 0, errors: [e instanceof Error ? e.message : 'Consulta indisponível'], timestamp: new Date().toISOString() }; }
    finally { setIsReconciling(false); }
  };
  return { fixCurrentPayment, runAutoReconciliation, isFixing: false, isReconciling };
};
