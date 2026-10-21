import { useState } from 'react';
import { readAsaasAudit } from '@/services/asaasAuditService';
import { toast } from 'sonner';

export interface ReconciliationResult {
  success: boolean;
  timestamp: string;
  summary: {
    pedidosCorrigidos: number;
    parcelasCorrigidas: number;
    erros: number;
    pagamentosAsaas: number;
    pedidosPendentesAntes: number;
  };
  detalhes: {
    pedidos: Array<{
      id: string;
      statusAnterior: string;
      statusNovo: string;
      motivo: string;
    }>;
    parcelas: Array<{
      id: string;
      pedidoId: string;
      numeroParcela: number;
      statusAnterior: string;
      statusNovo: string;
    }>;
    erros: Array<{
      tipo: string;
      mensagem: string;
      dados?: any;
    }>;
  };
}

export const useOrdersReconciliationComplete = () => {
  const [isReconciling, setIsReconciling] = useState(false);
  const [result, setResult] = useState<ReconciliationResult | null>(null);

  const runReconciliation = async (): Promise<ReconciliationResult | null> => {
    setIsReconciling(true);
    
    try {
      console.log('🔄 [RECONCILE] Iniciando reconciliação completa...');
      
      const audit = await readAsaasAudit();
      const reconciliationResult: ReconciliationResult = { success: true, timestamp: audit.timestamp,
        summary: { pedidosCorrigidos: 0, parcelasCorrigidas: 0, erros: audit.unmatched.length, pagamentosAsaas: audit.charges.length, pedidosPendentesAntes: audit.unmatched.length },
        detalhes: { pedidos: [], parcelas: [], erros: audit.unmatched.map(c => ({ tipo: 'evento_ausente', mensagem: `Cobrança ${c.asaas_id} sem evento correspondente` })) } };
      setResult(reconciliationResult);
      toast.info('Consulta Asaas concluída, sem corrigir pedidos ou parcelas; conciliação não certificada');

      return reconciliationResult;

    } catch (error: any) {
      console.error('❌ [RECONCILE] Erro:', error);
      toast.error(`Erro na reconciliação: ${error.message}`);
      return null;
    } finally {
      setIsReconciling(false);
    }
  };

  const clearResult = () => {
    setResult(null);
  };

  return {
    runReconciliation,
    isReconciling,
    result,
    clearResult
  };
};
