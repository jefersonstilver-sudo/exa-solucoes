
// Sistema de Gerenciamento de Sessões de Transação Únicas

import { supabase } from '@/integrations/supabase/client';
import { CartItem } from '@/types/payment';
import { calculateTotalPrice } from './checkoutUtils';
import { logSystemEvent } from './auditLogger';

interface TransactionSession {
  id: string;
  transaction_id: string;
  user_id: string;
  cart_items: any;
  calculated_price: number;
  selected_plan: number;
  status: 'created' | 'tentativa_created' | 'pedido_created' | 'payment_processing' | 'completed' | 'failed';
  tentativa_id?: string;
  pedido_id?: string;
  payment_external_id?: string;
  created_at: string;
  updated_at: string;
}

class TransactionSessionManager {
  private static instance: TransactionSessionManager;

  static getInstance(): TransactionSessionManager {
    if (!TransactionSessionManager.instance) {
      TransactionSessionManager.instance = new TransactionSessionManager();
    }
    return TransactionSessionManager.instance;
  }

  // Criar nova sessão de transação única
  async createTransactionSession(
    userId: string,
    cartItems: CartItem[],
    selectedPlan: number
  ): Promise<{ success: boolean; transactionId: string; calculatedPrice: number; sessionId: string }> {
    try {
      console.log("🆔 [TransactionSession] Criando nova sessão de transação");

      // Gerar ID único de transação
      const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // CRÍTICO: Calcular preço UMA ÚNICA VEZ e bloquear
      const calculatedPrice = calculateTotalPrice(selectedPlan, cartItems, 0, false);
      
      console.log("🔒 [TransactionSession] PREÇO CALCULADO E BLOQUEADO:", {
        transactionId,
        calculatedPrice,
        selectedPlan,
        cartItemsCount: cartItems.length,
        calculation: `${cartItems.length} painéis × ${selectedPlan} meses = R$ ${calculatedPrice}`,
        timestamp: new Date().toISOString()
      });

      // Validar que o preço é válido
      if (calculatedPrice <= 0) {
        throw new Error(`Preço calculado inválido: R$ ${calculatedPrice}`);
      }

      // Criar sessão na base de dados
      const { data: session, error } = await supabase
        .from('transaction_sessions')
        .insert({
          transaction_id: transactionId,
          user_id: userId,
          cart_items: {
            items: cartItems.map(item => ({
              panel_id: item.panel.id,
              building_name: item.panel.buildings?.nome,
              preco_base: item.panel.buildings?.preco_base,
              duration: item.duration
            })),
            count: cartItems.length
          },
          calculated_price: calculatedPrice,
          selected_plan: selectedPlan,
          status: 'created'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Log da criação da sessão
      logSystemEvent('TRANSACTION_SESSION_CREATED', {
        transactionId,
        sessionId: session.id,
        calculatedPrice,
        selectedPlan,
        cartItemsCount: cartItems.length
      });

      console.log("✅ [TransactionSession] Sessão criada com sucesso:", {
        sessionId: session.id,
        transactionId,
        calculatedPrice
      });

      return {
        success: true,
        transactionId,
        calculatedPrice,
        sessionId: session.id
      };

    } catch (error: any) {
      console.error("❌ [TransactionSession] Erro ao criar sessão:", error);
      
      logSystemEvent('TRANSACTION_SESSION_ERROR', {
        error: error.message,
        userId,
        cartItemsCount: cartItems.length
      }, 'ERROR');

      return {
        success: false,
        transactionId: '',
        calculatedPrice: 0,
        sessionId: ''
      };
    }
  }

  // Obter sessão de transação
  async getTransactionSession(transactionId: string): Promise<TransactionSession | null> {
    try {
      const { data, error } = await supabase
        .from('transaction_sessions')
        .select('*')
        .eq('transaction_id', transactionId)
        .single();

      if (error || !data) {
        console.warn("⚠️ [TransactionSession] Sessão não encontrada:", transactionId);
        return null;
      }

      return data as TransactionSession;
    } catch (error) {
      console.error("❌ [TransactionSession] Erro ao buscar sessão:", error);
      return null;
    }
  }

  // Atualizar status da sessão
  async updateSessionStatus(
    transactionId: string,
    status: TransactionSession['status'],
    updates: Partial<Pick<TransactionSession, 'tentativa_id' | 'pedido_id' | 'payment_external_id'>> = {}
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('transaction_sessions')
        .update({
          status,
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('transaction_id', transactionId);

      if (error) {
        throw error;
      }

      console.log("🔄 [TransactionSession] Status atualizado:", {
        transactionId,
        status,
        updates
      });

      return true;
    } catch (error) {
      console.error("❌ [TransactionSession] Erro ao atualizar status:", error);
      return false;
    }
  }

  // Validar integridade de preço
  async validatePriceIntegrity(transactionId: string, expectedPrice: number): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('validate_price_integrity', {
        p_transaction_id: transactionId,
        p_expected_price: expectedPrice
      });

      if (error) {
        throw error;
      }

      const isValid = data === true;
      
      if (!isValid) {
        console.error("❌ [TransactionSession] VALIDAÇÃO DE PREÇO FALHOU:", {
          transactionId,
          expectedPrice,
          validation: isValid
        });

        logSystemEvent('PRICE_VALIDATION_FAILED', {
          transactionId,
          expectedPrice,
          validation: isValid
        }, 'CRITICAL');
      }

      return isValid;
    } catch (error) {
      console.error("❌ [TransactionSession] Erro na validação de preço:", error);
      return false;
    }
  }

  // Recuperar transações perdidas
  async recoverLostTransactions(): Promise<any> {
    try {
      console.log("🔧 [TransactionSession] Executando recuperação de transações perdidas");

      const { data, error } = await supabase.rpc('recover_lost_transactions');

      if (error) {
        throw error;
      }

      console.log("✅ [TransactionSession] Recuperação concluída:", data);

      logSystemEvent('LOST_TRANSACTIONS_RECOVERED', {
        result: data
      });

      return data;
    } catch (error) {
      console.error("❌ [TransactionSession] Erro na recuperação:", error);
      
      logSystemEvent('RECOVERY_FAILED', {
        error: error.message
      }, 'ERROR');

      return { success: false, error: error.message };
    }
  }

  // Limpar sessões antigas (limpeza de manutenção)
  async cleanupOldSessions(): Promise<void> {
    try {
      // Remover sessões com mais de 24 horas que não foram concluídas
      const { error } = await supabase
        .from('transaction_sessions')
        .delete()
        .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .neq('status', 'completed');

      if (error) {
        throw error;
      }

      console.log("🧹 [TransactionSession] Limpeza de sessões antigas concluída");
    } catch (error) {
      console.error("❌ [TransactionSession] Erro na limpeza:", error);
    }
  }
}

export const transactionSessionManager = TransactionSessionManager.getInstance();
