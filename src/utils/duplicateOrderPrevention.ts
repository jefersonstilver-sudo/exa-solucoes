
// Sistema de Prevenção de Pedidos Duplicados - Correção Completa

interface OrderAttempt {
  userId: string;
  amount: number;
  timestamp: number;
  cartItems: any[];
  sessionId: string;
}

class DuplicateOrderPrevention {
  private static instance: DuplicateOrderPrevention;
  private recentAttempts: Map<string, OrderAttempt> = new Map();
  private processingLocks: Set<string> = new Set();
  private readonly DUPLICATE_WINDOW_MS = 5 * 60 * 1000; // 5 minutos
  private readonly PROCESSING_TIMEOUT_MS = 30 * 1000; // 30 segundos

  static getInstance(): DuplicateOrderPrevention {
    if (!DuplicateOrderPrevention.instance) {
      DuplicateOrderPrevention.instance = new DuplicateOrderPrevention();
    }
    return DuplicateOrderPrevention.instance;
  }

  // Gerar chave única para o pedido
  private generateOrderKey(userId: string, amount: number, cartItemsCount: number): string {
    return `${userId}-${amount}-${cartItemsCount}`;
  }

  // Verificar se já existe tentativa similar recente
  isDuplicateAttempt(userId: string, amount: number, cartItems: any[]): boolean {
    const key = this.generateOrderKey(userId, amount, cartItems.length);
    const now = Date.now();
    
    // Limpar tentativas antigas
    this.cleanupOldAttempts();
    
    const existingAttempt = this.recentAttempts.get(key);
    
    if (existingAttempt) {
      const timeDiff = now - existingAttempt.timestamp;
      
      if (timeDiff < this.DUPLICATE_WINDOW_MS) {
        console.warn("🚫 [DuplicateOrders] TENTATIVA DUPLICADA BLOQUEADA:", {
          userId: userId.substring(0, 8),
          amount,
          cartItemsCount: cartItems.length,
          timeSinceLastAttempt: timeDiff,
          key
        });
        
        return true;
      }
    }
    
    return false;
  }

  // Registrar nova tentativa
  registerAttempt(userId: string, amount: number, cartItems: any[]): string {
    const key = this.generateOrderKey(userId, amount, cartItems.length);
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const attempt: OrderAttempt = {
      userId,
      amount,
      timestamp: Date.now(),
      cartItems: cartItems.map(item => ({
        panelId: item.panel?.id,
        buildingId: item.panel?.building_id,
        price: item.panel?.buildings?.preco_base
      })),
      sessionId
    };
    
    this.recentAttempts.set(key, attempt);
    
    console.log("✅ [DuplicateOrders] TENTATIVA REGISTRADA:", {
      key,
      sessionId,
      userId: userId.substring(0, 8),
      amount,
      cartItemsCount: cartItems.length
    });
    
    return sessionId;
  }

  // Sistema de locks para processamento
  acquireProcessingLock(userId: string, amount: number): boolean {
    const lockKey = `processing-${userId}-${amount}`;
    
    if (this.processingLocks.has(lockKey)) {
      console.warn("🔒 [DuplicateOrders] PROCESSAMENTO JÁ EM ANDAMENTO:", {
        userId: userId.substring(0, 8),
        amount,
        lockKey
      });
      return false;
    }
    
    this.processingLocks.add(lockKey);
    
    // Auto-remover lock após timeout
    setTimeout(() => {
      this.processingLocks.delete(lockKey);
      console.log("🔓 [DuplicateOrders] LOCK REMOVIDO POR TIMEOUT:", lockKey);
    }, this.PROCESSING_TIMEOUT_MS);
    
    console.log("🔒 [DuplicateOrders] LOCK ADQUIRIDO:", lockKey);
    return true;
  }

  // Liberar lock de processamento
  releaseProcessingLock(userId: string, amount: number): void {
    const lockKey = `processing-${userId}-${amount}`;
    this.processingLocks.delete(lockKey);
    console.log("🔓 [DuplicateOrders] LOCK LIBERADO:", lockKey);
  }

  // Limpar tentativas antigas
  private cleanupOldAttempts(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.recentAttempts.forEach((attempt, key) => {
      if (now - attempt.timestamp > this.DUPLICATE_WINDOW_MS) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => {
      this.recentAttempts.delete(key);
    });
    
    if (keysToDelete.length > 0) {
      console.log("🧹 [DuplicateOrders] LIMPEZA:", `${keysToDelete.length} tentativas antigas removidas`);
    }
  }

  // Obter estatísticas para monitoramento
  getStats(): any {
    return {
      recentAttempts: this.recentAttempts.size,
      activeLocks: this.processingLocks.size,
      duplicateWindowMs: this.DUPLICATE_WINDOW_MS,
      processingTimeoutMs: this.PROCESSING_TIMEOUT_MS
    };
  }

  // Forçar limpeza completa
  clearAll(): void {
    this.recentAttempts.clear();
    this.processingLocks.clear();
    console.log("🧹 [DuplicateOrders] LIMPEZA COMPLETA REALIZADA");
  }
}

export const duplicateOrderPrevention = DuplicateOrderPrevention.getInstance();
