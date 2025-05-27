
import { supabase } from '@/integrations/supabase/client';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

/**
 * Executa limpeza automática de tentativas órfãs
 */
export const executeAutomaticCleanup = async (): Promise<{success: boolean, cleaned_count: number}> => {
  try {
    console.log("🧹 Executando limpeza automática de tentativas órfãs...");
    
    const { data, error } = await supabase.rpc('auto_cleanup_paid_attempts');
    
    if (error) {
      console.error("❌ Erro na limpeza automática:", error);
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_ERROR,
        LogLevel.ERROR,
        "Erro na limpeza automática de tentativas",
        { error: error.message }
      );
      return { success: false, cleaned_count: 0 };
    }
    
    console.log("✅ Limpeza automática concluída:", data);
    
    logCheckoutEvent(
      CheckoutEvent.PAYMENT_PROCESSING,
      LogLevel.INFO,
      `Limpeza automática executada: ${data?.cleaned_count || 0} tentativas removidas`,
      { result: data }
    );
    
    return data || { success: true, cleaned_count: 0 };
  } catch (error) {
    console.error("💥 Erro crítico na limpeza automática:", error);
    return { success: false, cleaned_count: 0 };
  }
};

/**
 * Força migração de dados órfãos (caso necessário)
 */
export const forceMigrateOrphanedPayments = async (): Promise<{success: boolean, migrated_count: number}> => {
  try {
    console.log("🔄 Forçando migração de dados órfãos...");
    
    const { data, error } = await supabase.rpc('migrate_orphaned_payments');
    
    if (error) {
      console.error("❌ Erro na migração forçada:", error);
      return { success: false, migrated_count: 0 };
    }
    
    console.log("✅ Migração forçada concluída:", data);
    return data || { success: true, migrated_count: 0 };
  } catch (error) {
    console.error("💥 Erro crítico na migração forçada:", error);
    return { success: false, migrated_count: 0 };
  }
};

/**
 * Configura limpeza automática periódica
 */
export const setupPeriodicCleanup = () => {
  // Executar limpeza automática a cada 5 minutos
  const cleanupInterval = setInterval(async () => {
    await executeAutomaticCleanup();
  }, 5 * 60 * 1000); // 5 minutos
  
  console.log("⏰ Limpeza automática periódica configurada (5 minutos)");
  
  // Retorna função para cancelar o interval
  return () => {
    clearInterval(cleanupInterval);
    console.log("🛑 Limpeza automática periódica cancelada");
  };
};
