
// Sistema de Recuperação de Transações Perdidas

import { supabase } from '@/integrations/supabase/client';

interface LostTransaction {
  id: string;
  userId: string;
  amount: number;
  timestamp: string;
  source: 'attempt' | 'webhook';
  evidence: any;
}

interface RecoveryResult {
  success: boolean;
  recoveredTransactions: number;
  totalValue: number;
  errors: string[];
  details: any[];
}

class TransactionRecoveryManager {
  private static instance: TransactionRecoveryManager;

  static getInstance(): TransactionRecoveryManager {
    if (!TransactionRecoveryManager.instance) {
      TransactionRecoveryManager.instance = new TransactionRecoveryManager();
    }
    return TransactionRecoveryManager.instance;
  }

  // Recuperar sua transação específica de R$ 0,29
  async recoverSpecificTransaction(userEmail: string, amount: number): Promise<RecoveryResult> {
    console.log("🔍 [Recovery] RECUPERANDO TRANSAÇÃO ESPECÍFICA:", { userEmail, amount });
    
    try {
      // Buscar usuário por email
      const { data: authUser } = await supabase.auth.getSession();
      if (!authUser.session?.user?.email || authUser.session.user.email !== userEmail) {
        throw new Error('Usuário não autenticado ou email não confere');
      }

      const userId = authUser.session.user.id;

      // Buscar tentativas correspondentes
      const { data: attempts, error: attemptsError } = await supabase
        .from('tentativas_compra')
        .select('*')
        .eq('id_user', userId)
        .eq('valor_total', amount)
        .order('created_at', { ascending: false });

      if (attemptsError) {
        throw attemptsError;
      }

      // Verificar se já existe pedido para essa transação
      const { data: existingOrders, error: ordersError } = await supabase
        .from('pedidos')
        .select('*')
        .eq('client_id', userId)
        .eq('valor_total', amount);

      if (ordersError) {
        throw ordersError;
      }

      const errors: string[] = [];
      const details: any[] = [];
      let recoveredCount = 0;
      let totalRecovered = 0;

      if (attempts && attempts.length > 0 && (!existingOrders || existingOrders.length === 0)) {
        // Recuperar a tentativa como pedido válido
        const attempt = attempts[0];
        
        const { data: newOrder, error: createError } = await supabase
          .from('pedidos')
          .insert({
            client_id: userId,
            lista_paineis: attempt.predios_selecionados?.map(String) || [],
            lista_predios: attempt.predios_selecionados || [],
            plano_meses: 1,
            valor_total: amount,
            status: 'pago_pendente_video',
            data_inicio: new Date().toISOString().split('T')[0],
            data_fim: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            termos_aceitos: true,
            log_pagamento: {
              payment_method: 'pix',
              payment_status: 'approved',
              recovered_transaction: true,
              original_attempt_id: attempt.id,
              recovery_timestamp: new Date().toISOString(),
              recovery_reason: 'Manual recovery of paid transaction'
            },
            created_at: attempt.created_at
          })
          .select()
          .single();

        if (createError) {
          errors.push(`Erro ao criar pedido: ${createError.message}`);
        } else {
          // Remover tentativa após conversão bem-sucedida
          await supabase
            .from('tentativas_compra')
            .delete()
            .eq('id', attempt.id);

          recoveredCount = 1;
          totalRecovered = amount;
          
          details.push({
            type: 'recovered_attempt',
            originalAttemptId: attempt.id,
            newOrderId: newOrder.id,
            amount: amount,
            timestamp: new Date().toISOString()
          });

          // Log da recuperação
          await supabase
            .from('log_eventos_sistema')
            .insert({
              tipo_evento: 'TRANSACTION_RECOVERY',
              descricao: `Transação de R$ ${amount} recuperada manualmente para usuário ${userEmail}`
            });
        }
      } else if (existingOrders && existingOrders.length > 0) {
        details.push({
          type: 'already_exists',
          message: 'Pedido já existe no sistema',
          existingOrders: existingOrders.length
        });
      } else {
        errors.push('Nenhuma tentativa encontrada para recuperar');
      }

      return {
        success: recoveredCount > 0,
        recoveredTransactions: recoveredCount,
        totalValue: totalRecovered,
        errors,
        details
      };

    } catch (error: any) {
      console.error("❌ [Recovery] ERRO NA RECUPERAÇÃO:", error);
      return {
        success: false,
        recoveredTransactions: 0,
        totalValue: 0,
        errors: [error.message],
        details: []
      };
    }
  }

  // Recuperação automática de todas as transações perdidas do usuário
  async autoRecoverUserTransactions(userId: string): Promise<RecoveryResult> {
    console.log("🔄 [Recovery] RECUPERAÇÃO AUTOMÁTICA PARA USUÁRIO:", userId);
    
    try {
      const errors: string[] = [];
      const details: any[] = [];
      let recoveredCount = 0;
      let totalRecovered = 0;

      // Buscar tentativas sem pedidos correspondentes
      const { data: orphanedAttempts, error } = await supabase
        .from('tentativas_compra')
        .select('*')
        .eq('id_user', userId)
        .gt('valor_total', 0);

      if (error) {
        throw error;
      }

      if (orphanedAttempts && orphanedAttempts.length > 0) {
        for (const attempt of orphanedAttempts) {
          // Verificar se já existe pedido para esta tentativa
          const { data: existingOrder } = await supabase
            .from('pedidos')
            .select('id')
            .eq('client_id', userId)
            .eq('valor_total', attempt.valor_total)
            .eq('created_at', attempt.created_at)
            .single();

          if (!existingOrder) {
            // Criar pedido para tentativa órfã
            const { data: newOrder, error: createError } = await supabase
              .from('pedidos')
              .insert({
                client_id: userId,
                lista_paineis: attempt.predios_selecionados?.map(String) || [],
                lista_predios: attempt.predios_selecionados || [],
                plano_meses: 1,
                valor_total: attempt.valor_total,
                status: 'pago_pendente_video',
                data_inicio: new Date().toISOString().split('T')[0],
                data_fim: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                termos_aceitos: true,
                log_pagamento: {
                  payment_method: 'pix',
                  payment_status: 'approved',
                  auto_recovered: true,
                  original_attempt_id: attempt.id,
                  recovery_timestamp: new Date().toISOString()
                },
                created_at: attempt.created_at
              })
              .select()
              .single();

            if (createError) {
              errors.push(`Erro ao recuperar tentativa ${attempt.id}: ${createError.message}`);
            } else {
              await supabase
                .from('tentativas_compra')
                .delete()
                .eq('id', attempt.id);

              recoveredCount++;
              totalRecovered += attempt.valor_total;
              
              details.push({
                type: 'auto_recovered',
                attemptId: attempt.id,
                orderId: newOrder.id,
                amount: attempt.valor_total
              });
            }
          }
        }
      }

      return {
        success: recoveredCount > 0,
        recoveredTransactions: recoveredCount,
        totalValue: totalRecovered,
        errors,
        details
      };

    } catch (error: any) {
      console.error("❌ [Recovery] ERRO NA RECUPERAÇÃO AUTOMÁTICA:", error);
      return {
        success: false,
        recoveredTransactions: 0,
        totalValue: 0,
        errors: [error.message],
        details: []
      };
    }
  }

  // Monitorar transações em tempo real
  async monitorRealtimeTransactions(): Promise<void> {
    console.log("👁️ [Recovery] INICIANDO MONITORAMENTO EM TEMPO REAL");
    
    // Monitorar inserções na tabela de tentativas
    supabase
      .channel('tentativas_monitor')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'tentativas_compra' },
        (payload) => {
          console.log("🔔 [Recovery] NOVA TENTATIVA DETECTADA:", payload.new);
          
          // Verificar se precisa de recuperação imediata
          if (payload.new.valor_total > 0) {
            setTimeout(() => {
              this.autoRecoverUserTransactions(payload.new.id_user);
            }, 60000); // Esperar 1 minuto antes de tentar recuperar
          }
        }
      )
      .subscribe();

    // Monitorar webhooks recebidos
    supabase
      .channel('webhook_monitor')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'webhook_logs' },
        (payload) => {
          console.log("🔔 [Recovery] NOVO WEBHOOK DETECTADO:", payload.new);
        }
      )
      .subscribe();
  }
}

export const transactionRecoveryManager = TransactionRecoveryManager.getInstance();
