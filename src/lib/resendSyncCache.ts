// ============================================
// CACHE SINGLETON PARA SINCRONIZAÇÃO RESEND
// ============================================
// Previne múltiplas chamadas simultâneas à API do Resend

interface SyncState {
  promise: Promise<any> | null;
  lastSync: number;
  isLoading: boolean;
}

class ResendSyncCache {
  private state: SyncState = {
    promise: null,
    lastSync: 0,
    isLoading: false,
  };

  // Tempo mínimo entre sincronizações (2 segundos para respeitar rate limit do Resend)
  private readonly MIN_SYNC_INTERVAL = 2000;

  async sync(syncFn: () => Promise<any>): Promise<any> {
    const now = Date.now();
    const timeSinceLastSync = now - this.state.lastSync;

    // Se já está carregando, retornar a promise existente
    if (this.state.isLoading && this.state.promise) {
      console.log('🔄 [RESEND CACHE] Reusing existing sync request');
      return this.state.promise;
    }

    // Se sincronizou recentemente, pular
    if (timeSinceLastSync < this.MIN_SYNC_INTERVAL) {
      console.log(`⏭️ [RESEND CACHE] Skipping sync (last sync ${timeSinceLastSync}ms ago)`);
      return { cached: true };
    }

    // Criar nova sincronização
    console.log('🆕 [RESEND CACHE] Starting new sync');
    this.state.isLoading = true;
    this.state.promise = syncFn()
      .then((result) => {
        this.state.lastSync = Date.now();
        this.state.isLoading = false;
        this.state.promise = null;
        console.log('✅ [RESEND CACHE] Sync completed');
        return result;
      })
      .catch((error) => {
        this.state.isLoading = false;
        this.state.promise = null;
        console.error('❌ [RESEND CACHE] Sync failed:', error);
        throw error;
      });

    return this.state.promise;
  }

  reset() {
    this.state = {
      promise: null,
      lastSync: 0,
      isLoading: false,
    };
  }
}

// Exportar singleton
export const resendSyncCache = new ResendSyncCache();
