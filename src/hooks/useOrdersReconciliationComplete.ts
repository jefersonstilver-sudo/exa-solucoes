import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
      
      const { data, error } = await supabase.functions.invoke('reconcile-orders-complete', {
        method: 'POST'
      });

      if (error) {
        throw error;
      }

      const reconciliationResult = data as ReconciliationResult;
      setResult(reconciliationResult);

      if (reconciliationResult.success) {
        const { pedidosCorrigidos, parcelasCorrigidas, erros } = reconciliationResult.summary;
        
        if (pedidosCorrigidos > 0 || parcelasCorrigidas > 0) {
          toast.success(
            `Reconciliação concluída: ${pedidosCorrigidos} pedidos e ${parcelasCorrigidas} parcelas corrigidos`,
            { duration: 5000 }
          );
        } else if (erros === 0) {
          toast.info('Nenhuma divergência encontrada - tudo sincronizado!');
        }

        if (erros > 0) {
          toast.warning(`${erros} erros encontrados durante a reconciliação`);
        }
      }

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
