
// Hook para Debug PIX

import { useState } from 'react';
import { pixDebugUtils } from '@/utils/pixDebugUtils';
import { toast } from 'sonner';

export const usePixDebug = () => {
  const [isDebugging, setIsDebugging] = useState(false);
  const [debugResults, setDebugResults] = useState<any>(null);

  const runFullDiagnosis = async () => {
    setIsDebugging(true);
    setDebugResults(null);

    try {
      console.log('🔍 [PIX Debug] Iniciando diagnóstico completo do sistema PIX');
      
      // Executar todas as verificações
      const [lostPayments, connectivity, orphanPayments] = await Promise.all([
        pixDebugUtils.investigateLostPayments(24),
        pixDebugUtils.testWebhookConnectivity(),
        pixDebugUtils.recoverOrphanPayments()
      ]);

      const results = {
        lostPayments,
        connectivity,
        orphanPayments,
        timestamp: new Date().toISOString(),
        summary: {
          totalIssues: [lostPayments, connectivity, orphanPayments]
            .reduce((acc, result) => acc + (result.success ? 0 : 1), 0),
          totalRecommendations: [lostPayments, connectivity, orphanPayments]
            .reduce((acc, result) => acc + (result.recommendations?.length || 0), 0)
        }
      };

      setDebugResults(results);

      // Mostrar resumo
      const hasIssues = results.summary.totalIssues > 0;
      const message = hasIssues 
        ? `Diagnóstico concluído: ${results.summary.totalIssues} problema(s) encontrado(s)`
        : 'Diagnóstico concluído: Sistema funcionando normalmente';

      if (hasIssues) {
        toast.warning(message);
      } else {
        toast.success(message);
      }

      console.log('✅ [PIX Debug] Diagnóstico completo concluído:', results);

    } catch (error: any) {
      console.error('❌ [PIX Debug] Erro no diagnóstico:', error);
      toast.error(`Erro no diagnóstico: ${error.message}`);
    } finally {
      setIsDebugging(false);
    }
  };

  const simulatePayment = async (pedidoId: string) => {
    setIsDebugging(true);

    try {
      const result = await pixDebugUtils.simulatePaymentConfirmation(pedidoId);
      
      if (result.success) {
        toast.success('Pagamento simulado com sucesso!');
      } else {
        toast.error('Erro na simulação do pagamento');
      }

      return result;
    } catch (error: any) {
      console.error('❌ [PIX Debug] Erro na simulação:', error);
      toast.error(`Erro na simulação: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setIsDebugging(false);
    }
  };

  const checkWebhookStatus = async () => {
    setIsDebugging(true);

    try {
      const result = await pixDebugUtils.testWebhookConnectivity();
      
      if (result.success) {
        toast.success('Webhook funcionando corretamente');
      } else {
        toast.error('Problema detectado no webhook');
      }

      return result;
    } catch (error: any) {
      console.error('❌ [PIX Debug] Erro no teste de webhook:', error);
      toast.error(`Erro no teste: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setIsDebugging(false);
    }
  };

  return {
    isDebugging,
    debugResults,
    runFullDiagnosis,
    simulatePayment,
    checkWebhookStatus
  };
};
