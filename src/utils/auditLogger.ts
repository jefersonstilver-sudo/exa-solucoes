
// NOVA FUNCIONALIDADE: Sistema de auditoria para rastrear inconsistências de preços

interface PriceAuditLog {
  timestamp: string;
  component: string;
  action: string;
  data: any;
  userId?: string;
  sessionId?: string;
}

class PriceAuditLogger {
  private static instance: PriceAuditLogger;
  private logs: PriceAuditLog[] = [];
  private sessionId: string;

  static getInstance(): PriceAuditLogger {
    if (!PriceAuditLogger.instance) {
      PriceAuditLogger.instance = new PriceAuditLogger();
    }
    return PriceAuditLogger.instance;
  }

  private constructor() {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`🔍 [PriceAuditLogger] Iniciado - SessionID: ${this.sessionId}`);
  }

  log(component: string, action: string, data: any, userId?: string): void {
    const logEntry: PriceAuditLog = {
      timestamp: new Date().toISOString(),
      component,
      action,
      data,
      userId,
      sessionId: this.sessionId
    };

    this.logs.push(logEntry);
    
    // Manter apenas os últimos 50 logs para evitar memory leak
    if (this.logs.length > 50) {
      this.logs.shift();
    }

    console.log(`🔍 [AUDIT] ${component} - ${action}:`, data);

    // Detectar inconsistências críticas
    this.detectInconsistencies(logEntry);
  }

  private detectInconsistencies(logEntry: PriceAuditLog): void {
    // Detectar valores suspeitos
    if (logEntry.data?.totalPrice && logEntry.data.totalPrice < 1) {
      console.warn(`⚠️ [AUDIT WARNING] Valor suspeito detectado em ${logEntry.component}:`, {
        component: logEntry.component,
        totalPrice: logEntry.data.totalPrice,
        data: logEntry.data
      });
    }

    // Detectar diferenças entre componentes
    const recentLogs = this.logs.slice(-5);
    const priceValues = recentLogs
      .filter(log => log.data?.totalPrice || log.data?.finalPrice || log.data?.orderTotal)
      .map(log => ({
        component: log.component,
        price: log.data.totalPrice || log.data.finalPrice || log.data.orderTotal,
        timestamp: log.timestamp
      }));

    if (priceValues.length >= 2) {
      const uniquePrices = [...new Set(priceValues.map(p => p.price))];
      if (uniquePrices.length > 1) {
        console.warn(`⚠️ [AUDIT WARNING] Preços inconsistentes detectados:`, priceValues);
      }
    }
  }

  getAuditReport(): PriceAuditLog[] {
    return [...this.logs];
  }

  exportAuditReport(): string {
    return JSON.stringify({
      sessionId: this.sessionId,
      logs: this.logs,
      summary: {
        totalLogs: this.logs.length,
        components: [...new Set(this.logs.map(log => log.component))],
        timeRange: {
          start: this.logs[0]?.timestamp,
          end: this.logs[this.logs.length - 1]?.timestamp
        }
      }
    }, null, 2);
  }

  clearLogs(): void {
    this.logs = [];
    console.log('🔍 [PriceAuditLogger] Logs limpos');
  }
}

export const priceAuditLogger = PriceAuditLogger.getInstance();

// Helper functions para facilitar o uso
export const logPriceCalculation = (component: string, data: any, userId?: string) => {
  priceAuditLogger.log(component, 'PRICE_CALCULATION', data, userId);
};

export const logPriceInconsistency = (component: string, data: any, userId?: string) => {
  priceAuditLogger.log(component, 'PRICE_INCONSISTENCY', data, userId);
};

export const logCheckoutFlow = (component: string, data: any, userId?: string) => {
  priceAuditLogger.log(component, 'CHECKOUT_FLOW', data, userId);
};
