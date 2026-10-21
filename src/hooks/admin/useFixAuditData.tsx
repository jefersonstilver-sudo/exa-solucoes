import { useState } from 'react';
import { verifyAsaasOrder } from '@/services/asaasPaymentService';
import { readAsaasAudit } from '@/services/asaasAuditService';
import { toast } from 'sonner';

interface FixAuditResult {
  success: boolean;
  updated?: number;
  failed?: number;
  errors?: string[];
  message?: string;
}

export const useFixAuditData = () => {
  const [isFixing, setIsFixing] = useState(false);
  const fixOrderAuditData = async (orderId: string): Promise<FixAuditResult> => {
    setIsFixing(true);
    try {
      const result = await verifyAsaasOrder(orderId);
      const message = result.payment_found ? `Status Asaas: ${result.payment_status}. Pedido não alterado.` : 'Sem cobrança Asaas vinculada';
      toast.info(message);
      return { success: result.payment_found, updated: 0, message };
    } catch (e) { return { success: false, message: e instanceof Error ? e.message : 'Consulta indisponível' }; }
    finally { setIsFixing(false); }
  };
  const fixAllOrders = async (): Promise<FixAuditResult> => {
    setIsFixing(true);
    try { await readAsaasAudit(); toast.info('Consulta Asaas concluída, sem alterar pedidos'); return { success: true, updated: 0 }; }
    finally { setIsFixing(false); }
  };
  return { fixOrderAuditData, fixAllOrders, isFixing };
};
