
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AutoVerificationResult {
  success: boolean;
  total_checked: number;
  verified_count: number;
  approved_count: number;
  errors: string[];
  timestamp: string;
}

export const useAutoPaymentVerifier = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState<AutoVerificationResult | null>(null);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  // Executar verificação manual
  const runVerification = async (): Promise<AutoVerificationResult> => {
    setIsRunning(true);
    
    try {
      console.log('🔄 [AUTO_VERIFIER] Executando verificação manual');

      const { data, error } = await supabase.functions.invoke('auto-verify-payments');

      if (error) {
        throw error;
      }

      const result = data as AutoVerificationResult;
      setLastResult(result);

      if (result.success && result.approved_count > 0) {
        toast.success(`${result.approved_count} pagamentos confirmados automaticamente!`);
      } else if (result.success) {
        toast.info(`Verificação concluída: ${result.verified_count} pagamentos verificados`);
      } else {
        toast.error(`Erro na verificação: ${result.errors?.[0] || 'Erro desconhecido'}`);
      }

      return result;

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('❌ [AUTO_VERIFIER] Erro na verificação:', error);
      const errorResult = {
        success: false,
        total_checked: 0,
        verified_count: 0,
        approved_count: 0,
        errors: [message],
        timestamp: new Date().toISOString()
      };
      setLastResult(errorResult);
      toast.error(`Erro na verificação automática: ${message}`);
      return errorResult;
    } finally {
      setIsRunning(false);
    }
  };

  // Suspenso durante a reconstrução financeira: a verificação legada pode baixar pedidos.
  const startAutoVerification = () => {
    toast.info('Verificação automática suspensa durante a reconstrução financeira.');
  };

  // Parar verificação automática
  const stopAutoVerification = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
      console.log('🛑 [AUTO_VERIFIER] Verificação automática parada');
      toast.info('Sistema de verificação automática parado');
    }
  };

  // Limpar intervalo ao desmontar
  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  return {
    isRunning,
    lastResult,
    isAutoRunning: !!intervalId,
    runVerification,
    startAutoVerification,
    stopAutoVerification
  };
};
