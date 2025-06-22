
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
        toast.error(`Erro na verificação: ${result.error || 'Erro desconhecido'}`);
      }

      return result;

    } catch (error: any) {
      console.error('❌ [AUTO_VERIFIER] Erro na verificação:', error);
      const errorResult = {
        success: false,
        total_checked: 0,
        verified_count: 0,
        approved_count: 0,
        errors: [error.message],
        timestamp: new Date().toISOString()
      };
      setLastResult(errorResult);
      toast.error(`Erro na verificação automática: ${error.message}`);
      return errorResult;
    } finally {
      setIsRunning(false);
    }
  };

  // Iniciar verificação automática (a cada 5 minutos)
  const startAutoVerification = () => {
    if (intervalId) {
      console.log('⚠️ [AUTO_VERIFIER] Verificação automática já está rodando');
      return;
    }

    console.log('🚀 [AUTO_VERIFIER] Iniciando verificação automática (a cada 5 minutos)');
    
    // Executar imediatamente
    runVerification();
    
    // Configurar execução periódica
    const id = setInterval(() => {
      runVerification();
    }, 5 * 60 * 1000); // 5 minutos

    setIntervalId(id);
    toast.success('Sistema de verificação automática iniciado!');
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
