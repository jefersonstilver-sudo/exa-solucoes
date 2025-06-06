

// Sistema de Auditoria e Logs para Transações

interface AuditLogEntry {
  operation: string;
  data: any;
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
}

class AuditLogger {
  private static instance: AuditLogger;
  private logs: AuditLogEntry[] = [];
  private readonly MAX_LOGS = 1000;

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  private addLog(operation: string, data: any, level: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' = 'INFO') {
    const entry: AuditLogEntry = {
      operation,
      data,
      timestamp: new Date().toISOString(),
      level
    };

    this.logs.unshift(entry);
    
    // Manter apenas os logs mais recentes
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(0, this.MAX_LOGS);
    }

    // Log no console com formatação apropriada
    const emoji = level === 'ERROR' ? '❌' : level === 'WARNING' ? '⚠️' : level === 'CRITICAL' ? '🚨' : '📊';
    console.log(`${emoji} [AUDIT-${level}] ${operation}:`, data);
  }

  logPriceCalculation(operation: string, data: any) {
    this.addLog(`PRICE_CALCULATION:${operation}`, {
      ...data,
      calculationType: 'price_calculation'
    }, 'INFO');
  }

  logTransactionAttempt(operation: string, data: any) {
    this.addLog(`TRANSACTION:${operation}`, {
      ...data,
      transactionType: 'attempt'
    }, 'INFO');
  }

  logPaymentProcessing(operation: string, data: any, level: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' = 'INFO') {
    this.addLog(`PAYMENT:${operation}`, {
      ...data,
      paymentType: 'processing'
    }, level);
  }

  logSystemEvent(operation: string, data: any, level: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' = 'INFO') {
    this.addLog(`SYSTEM:${operation}`, {
      ...data,
      systemEvent: true
    }, level);
  }

  // Obter logs filtrados
  getLogs(filter?: { operation?: string; level?: string; limit?: number }) {
    let filteredLogs = this.logs;

    if (filter?.operation) {
      filteredLogs = filteredLogs.filter(log => 
        log.operation.toLowerCase().includes(filter.operation!.toLowerCase())
      );
    }

    if (filter?.level) {
      filteredLogs = filteredLogs.filter(log => log.level === filter.level);
    }

    if (filter?.limit) {
      filteredLogs = filteredLogs.slice(0, filter.limit);
    }

    return filteredLogs;
  }

  // Limpar logs
  clearLogs() {
    this.logs = [];
    console.log("🧹 [AUDIT] Logs limpos");
  }

  // Exportar logs para análise
  exportLogs() {
    return {
      logs: this.logs,
      exportedAt: new Date().toISOString(),
      totalEntries: this.logs.length
    };
  }

  // Estatísticas dos logs
  getStats() {
    const stats = {
      total: this.logs.length,
      byLevel: {} as Record<string, number>,
      byOperation: {} as Record<string, number>,
      lastHour: 0,
      last24Hours: 0
    };

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    this.logs.forEach(log => {
      // Count by level
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
      
      // Count by operation
      const opType = log.operation.split(':')[0];
      stats.byOperation[opType] = (stats.byOperation[opType] || 0) + 1;
      
      // Count by time
      const logTime = new Date(log.timestamp);
      if (logTime > oneHourAgo) {
        stats.lastHour++;
      }
      if (logTime > oneDayAgo) {
        stats.last24Hours++;
      }
    });

    return stats;
  }
}

export const auditLogger = AuditLogger.getInstance();

// Funções helper para facilitar o uso
export const logPriceCalculation = (operation: string, data: any) => {
  auditLogger.logPriceCalculation(operation, data);
};

export const logTransactionAttempt = (operation: string, data: any) => {
  auditLogger.logTransactionAttempt(operation, data);
};

export const logPaymentProcessing = (operation: string, data: any, level: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' = 'INFO') => {
  auditLogger.logPaymentProcessing(operation, data, level);
};

export const logSystemEvent = (operation: string, data: any, level: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' = 'INFO') => {
  auditLogger.logSystemEvent(operation, data, level);
};

