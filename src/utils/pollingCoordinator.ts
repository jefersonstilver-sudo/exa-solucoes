/**
 * ⚡ POLLING COORDINATOR
 * 
 * Sistema centralizado para controlar refetches e evitar sobrecarga
 * 
 * Problema que resolve:
 * - Múltiplos hooks fazendo refetch simultâneo
 * - Realtime subscriptions disparando centenas de updates
 * - Sistema ficando lento por excesso de queries
 * 
 * Solução:
 * - Throttle de 30 segundos entre refetches
 * - Tracking de pending updates
 * - Logs de debugging
 */

interface PendingUpdate {
  key: string;
  scheduledFor: number;
  timeout?: NodeJS.Timeout;
}

class PollingCoordinator {
  private lastFetch = new Map<string, number>();
  private pendingUpdates = new Map<string, PendingUpdate>();
  private readonly MIN_INTERVAL = 30000; // 30 segundos (antes: sem controle)

  /**
   * Verifica se pode fazer refetch agora ou se deve aguardar
   */
  canFetch(key: string): boolean {
    const last = this.lastFetch.get(key) || 0;
    const now = Date.now();
    const timeSinceLast = now - last;
    
    // Se passou o intervalo mínimo, liberar
    if (timeSinceLast >= this.MIN_INTERVAL) {
      this.lastFetch.set(key, now);
      this.pendingUpdates.delete(key);
      console.log(`✅ [POLLING] Permitido: ${key} (${timeSinceLast}ms desde último)`);
      return true;
    }
    
    // Se não, registrar como pending
    const timeToWait = this.MIN_INTERVAL - timeSinceLast;
    console.log(`⏸️ [POLLING] Throttled: ${key} (aguardar ${Math.round(timeToWait / 1000)}s)`);
    
    // Agendar update para quando o intervalo passar
    this.schedulePendingUpdate(key, timeToWait);
    
    return false;
  }

  /**
   * Força um fetch imediato, ignorando throttle
   * Usar apenas em casos críticos (ex: ação manual do usuário)
   */
  forceFetch(key: string) {
    this.lastFetch.set(key, Date.now());
    this.clearPendingUpdate(key);
    console.log(`🔥 [POLLING] Forçado: ${key}`);
  }

  /**
   * Verifica se há update pendente
   */
  hasPending(key: string): boolean {
    return this.pendingUpdates.has(key);
  }

  /**
   * Agenda um update para quando o throttle expirar
   */
  private schedulePendingUpdate(key: string, delayMs: number) {
    // Se já existe pending, não criar duplicado
    if (this.pendingUpdates.has(key)) {
      return;
    }

    const scheduledFor = Date.now() + delayMs;
    const pending: PendingUpdate = {
      key,
      scheduledFor
    };

    this.pendingUpdates.set(key, pending);
    console.log(`⏰ [POLLING] Agendado: ${key} para ${Math.round(delayMs / 1000)}s`);
  }

  /**
   * Limpa update pendente
   */
  private clearPendingUpdate(key: string) {
    const pending = this.pendingUpdates.get(key);
    if (pending?.timeout) {
      clearTimeout(pending.timeout);
    }
    this.pendingUpdates.delete(key);
  }

  /**
   * Obtém estatísticas do coordinator
   */
  getStats() {
    return {
      totalKeys: this.lastFetch.size,
      pendingUpdates: this.pendingUpdates.size,
      keys: Array.from(this.lastFetch.keys()),
      pending: Array.from(this.pendingUpdates.keys())
    };
  }

  /**
   * Reseta o coordinator (útil para debugging)
   */
  reset() {
    this.lastFetch.clear();
    this.pendingUpdates.forEach(p => {
      if (p.timeout) clearTimeout(p.timeout);
    });
    this.pendingUpdates.clear();
    console.log('🔄 [POLLING] Coordinator resetado');
  }
}

// Singleton global
export const pollingCoordinator = new PollingCoordinator();

// Expor no window para debugging
if (typeof window !== 'undefined') {
  (window as any).pollingCoordinator = pollingCoordinator;
  console.log('⚡ Polling Coordinator: window.pollingCoordinator.getStats()');
}
