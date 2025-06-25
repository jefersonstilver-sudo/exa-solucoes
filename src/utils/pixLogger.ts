
interface PixLogEvent {
  timestamp: string;
  event: string;
  pedidoId: string;
  details: any;
  level: 'info' | 'warn' | 'error' | 'success';
}

class PixLogger {
  private logs: PixLogEvent[] = [];

  log(event: string, pedidoId: string, details: any, level: 'info' | 'warn' | 'error' | 'success' = 'info') {
    const logEvent: PixLogEvent = {
      timestamp: new Date().toISOString(),
      event,
      pedidoId,
      details,
      level
    };
    
    this.logs.push(logEvent);
    
    // Console log com emoji baseado no level
    const emoji = {
      info: '🔍',
      warn: '⚠️',
      error: '❌',
      success: '✅'
    }[level];
    
    console.log(`${emoji} [PIX-MONITOR] ${event}:`, {
      pedidoId,
      details,
      timestamp: logEvent.timestamp
    });
    
    // Manter apenas os últimos 100 logs
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100);
    }
  }

  getLogs(pedidoId?: string): PixLogEvent[] {
    if (pedidoId) {
      return this.logs.filter(log => log.pedidoId === pedidoId);
    }
    return this.logs;
  }

  clearLogs(pedidoId?: string) {
    if (pedidoId) {
      this.logs = this.logs.filter(log => log.pedidoId !== pedidoId);
    } else {
      this.logs = [];
    }
  }
}

export const pixLogger = new PixLogger();

// Funções de conveniência
export const logPixSuccess = (event: string, pedidoId: string, details: any) => {
  pixLogger.log(event, pedidoId, details, 'success');
};

export const logPixError = (event: string, pedidoId: string, details: any) => {
  pixLogger.log(event, pedidoId, details, 'error');
};

export const logPixWarning = (event: string, pedidoId: string, details: any) => {
  pixLogger.log(event, pedidoId, details, 'warn');
};

export const logPixInfo = (event: string, pedidoId: string, details: any) => {
  pixLogger.log(event, pedidoId, details, 'info');
};
