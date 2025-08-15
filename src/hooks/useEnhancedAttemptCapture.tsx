
// Sistema Aprimorado de Captura de Tentativas - TEMPORARIAMENTE DESABILITADO

import { useState } from 'react';
import { useUserSession } from './useUserSession';
import { CartItem } from '@/types/payment';
import { logSystemEvent } from '@/utils/auditLogger';
import { toast } from 'sonner';

interface CaptureAttemptResult {
  success: boolean;
  tentativaId?: string;
  error?: string;
}

export const useEnhancedAttemptCapture = () => {
  const { user } = useUserSession();
  const [isCapturing, setIsCapturing] = useState(false);

  const captureAttempt = async (
    transactionId: string,
    cartItems: CartItem[],
    selectedPlan: number,
    calculatedPrice: number
  ): Promise<CaptureAttemptResult> => {
    if (!user?.id) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    setIsCapturing(true);

    try {
      console.log("📝 [EnhancedAttemptCapture] Sistema temporariamente desabilitado - usando fallback local");

      // Por ora, apenas simular captura até tipos serem corrigidos
      const mockTentativaId = `local_${Date.now()}`;

      console.log("✅ [EnhancedAttemptCapture] Tentativa simulada:", {
        tentativaId: mockTentativaId,
        transactionId,
        valorTotal: calculatedPrice,
        selectedPlan,
        cartItemsCount: cartItems.length
      });

      // Log para auditoria
      logSystemEvent('ENHANCED_ATTEMPT_CAPTURED_MOCK', {
        tentativaId: mockTentativaId,
        transactionId,
        userId: user.id,
        valorTotal: calculatedPrice,
        selectedPlan,
        cartItemsCount: cartItems.length,
        priceLocked: true,
        mock: true
      });

      return { success: true, tentativaId: mockTentativaId };

    } catch (error: any) {
      console.error("❌ [EnhancedAttemptCapture] Erro na captura:", error);
      
      logSystemEvent('ATTEMPT_CAPTURE_ERROR', {
        transactionId,
        error: error.message,
        userId: user.id
      }, 'ERROR');

      return { success: false, error: error.message };
    } finally {
      setIsCapturing(false);
    }
  };

  // Buscar tentativa por transaction_id (simulado)
  const getAttemptByTransactionId = async (transactionId: string) => {
    console.log("⚠️ [EnhancedAttemptCapture] Função temporariamente desabilitada");
    return null;
  };

  // Verificar duplicações por usuário (simulado)
  const checkForDuplicates = async (userId: string, valorTotal: number): Promise<any[]> => {
    console.log("⚠️ [EnhancedAttemptCapture] Verificação de duplicatas temporariamente desabilitada");
    return [];
  };

  // Limpar tentativas antigas órfãs (simulado)
  const cleanupOrphanedAttempts = async (): Promise<number> => {
    console.log("⚠️ [EnhancedAttemptCapture] Limpeza temporariamente desabilitada");
    return 0;
  };

  return {
    isCapturing,
    captureAttempt,
    getAttemptByTransactionId,
    checkForDuplicates,
    cleanupOrphanedAttempts
  };
};
