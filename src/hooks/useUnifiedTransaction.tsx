
// Hook Unificado para Transações com ID Único

import { useState, useEffect } from 'react';
import { useUserSession } from './useUserSession';
import { transactionSessionManager } from '@/utils/transactionSessionManager';
import { CartItem } from '@/types/payment';
import { toast } from 'sonner';
import { logSystemEvent } from '@/utils/auditLogger';

export const useUnifiedTransaction = () => {
  const { user } = useUserSession();
  const [currentTransactionId, setCurrentTransactionId] = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [sessionPrice, setSessionPrice] = useState<number>(0);

  // Criar sessão de transação única
  const createTransactionSession = async (
    cartItems: CartItem[],
    selectedPlan: number
  ): Promise<{ success: boolean; transactionId: string; price: number }> => {
    if (!user?.id) {
      toast.error("Usuário não autenticado");
      return { success: false, transactionId: '', price: 0 };
    }

    setIsCreatingSession(true);

    try {
      console.log("🆔 [UnifiedTransaction] Criando sessão de transação unificada");

      const result = await transactionSessionManager.createTransactionSession(
        user.id,
        cartItems,
        selectedPlan
      );

      if (!result.success) {
        throw new Error("Falha ao criar sessão de transação");
      }

      setCurrentTransactionId(result.transactionId);
      setSessionPrice(result.calculatedPrice);

      console.log("✅ [UnifiedTransaction] Sessão criada:", {
        transactionId: result.transactionId,
        price: result.calculatedPrice
      });

      // Log para auditoria
      logSystemEvent('UNIFIED_TRANSACTION_CREATED', {
        transactionId: result.transactionId,
        userId: user.id,
        calculatedPrice: result.calculatedPrice,
        selectedPlan,
        cartItemsCount: cartItems.length
      });

      return {
        success: true,
        transactionId: result.transactionId,
        price: result.calculatedPrice
      };

    } catch (error: any) {
      console.error("❌ [UnifiedTransaction] Erro na criação:", error);
      toast.error("Erro ao iniciar transação");
      
      return { success: false, transactionId: '', price: 0 };
    } finally {
      setIsCreatingSession(false);
    }
  };

  // Atualizar status da transação
  const updateTransactionStatus = async (
    status: string,
    updates: any = {}
  ): Promise<boolean> => {
    if (!currentTransactionId) {
      console.warn("⚠️ [UnifiedTransaction] Nenhuma transação ativa para atualizar");
      return false;
    }

    try {
      const success = await transactionSessionManager.updateSessionStatus(
        currentTransactionId,
        status as any,
        updates
      );

      if (success) {
        console.log("🔄 [UnifiedTransaction] Status atualizado:", {
          transactionId: currentTransactionId,
          status,
          updates
        });
      }

      return success;
    } catch (error) {
      console.error("❌ [UnifiedTransaction] Erro ao atualizar status:", error);
      return false;
    }
  };

  // Validar integridade do preço
  const validateTransactionPrice = async (expectedPrice: number): Promise<boolean> => {
    if (!currentTransactionId) {
      console.error("❌ [UnifiedTransaction] Nenhuma transação ativa para validar");
      return false;
    }

    try {
      const isValid = await transactionSessionManager.validatePriceIntegrity(
        currentTransactionId,
        expectedPrice
      );

      if (!isValid) {
        console.error("❌ [UnifiedTransaction] VALIDAÇÃO DE PREÇO FALHOU:", {
          transactionId: currentTransactionId,
          expectedPrice,
          sessionPrice
        });

        toast.error("Erro de validação de preço detectado");
        
        logSystemEvent('PRICE_VALIDATION_FAILED', {
          transactionId: currentTransactionId,
          expectedPrice,
          sessionPrice
        }, 'CRITICAL');
      }

      return isValid;
    } catch (error) {
      console.error("❌ [UnifiedTransaction] Erro na validação:", error);
      return false;
    }
  };

  // Obter sessão atual
  const getCurrentSession = async () => {
    if (!currentTransactionId) return null;

    try {
      return await transactionSessionManager.getTransactionSession(currentTransactionId);
    } catch (error) {
      console.error("❌ [UnifiedTransaction] Erro ao obter sessão:", error);
      return null;
    }
  };

  // Limpar transação atual
  const clearCurrentTransaction = () => {
    setCurrentTransactionId(null);
    setSessionPrice(0);
  };

  // Recuperar transações perdidas (função administrativa)
  const recoverLostTransactions = async () => {
    try {
      const result = await transactionSessionManager.recoverLostTransactions();
      
      if (result.success) {
        toast.success(`${result.recovered_transactions} transações recuperadas!`);
      } else {
        toast.error("Erro na recuperação de transações");
      }

      return result;
    } catch (error) {
      console.error("❌ [UnifiedTransaction] Erro na recuperação:", error);
      toast.error("Erro na recuperação de transações");
      return { success: false };
    }
  };

  return {
    // Estado
    currentTransactionId,
    sessionPrice,
    isCreatingSession,

    // Ações
    createTransactionSession,
    updateTransactionStatus,
    validateTransactionPrice,
    getCurrentSession,
    clearCurrentTransaction,
    recoverLostTransactions
  };
};
