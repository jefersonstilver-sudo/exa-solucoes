/**
 * Sistema de logs estruturados para monitoramento de uploads
 */

interface UploadLogEntry {
  timestamp: number;
  orderId: string;
  userId: string;
  phase: 'SECURITY' | 'CLEANUP' | 'VALIDATION' | 'UPLOAD' | 'DATABASE' | 'COMPLETE' | 'ERROR';
  status: 'START' | 'SUCCESS' | 'FAIL' | 'RETRY';
  duration?: number;
  details?: any;
  error?: string;
}

class VideoUploadLogger {
  private logs: UploadLogEntry[] = [];
  private readonly maxLogs = 1000;

  log(entry: Omit<UploadLogEntry, 'timestamp'>) {
    const logEntry: UploadLogEntry = {
      ...entry,
      timestamp: Date.now()
    };

    this.logs.push(logEntry);

    // Manter apenas os últimos logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log estruturado no console
    const icon = this.getPhaseIcon(entry.phase);
    const statusIcon = this.getStatusIcon(entry.status);
    
    console.log(
      `${icon} [${entry.phase}] ${statusIcon}`, 
      {
        orderId: entry.orderId,
        userId: entry.userId,
        duration: entry.duration ? `${entry.duration}ms` : undefined,
        details: entry.details,
        error: entry.error
      }
    );
  }

  private getPhaseIcon(phase: UploadLogEntry['phase']): string {
    const icons = {
      SECURITY: '🔒',
      CLEANUP: '🧹', 
      VALIDATION: '✅',
      UPLOAD: '📤',
      DATABASE: '💾',
      COMPLETE: '🎉',
      ERROR: '❌'
    };
    return icons[phase];
  }

  private getStatusIcon(status: UploadLogEntry['status']): string {
    const icons = {
      START: '▶️',
      SUCCESS: '✅',
      FAIL: '❌',
      RETRY: '🔄'
    };
    return icons[status];
  }

  // Analisar logs para debugging
  analyzeUploadIssues(orderId: string) {
    const orderLogs = this.logs.filter(log => log.orderId === orderId);
    
    if (orderLogs.length === 0) {
      return { found: false, message: 'Nenhum log encontrado para este pedido' };
    }

    const issues = [];
    const phases = ['SECURITY', 'CLEANUP', 'VALIDATION', 'UPLOAD', 'DATABASE'] as const;
    
    for (const phase of phases) {
      const phaseLogs = orderLogs.filter(log => log.phase === phase);
      const failures = phaseLogs.filter(log => log.status === 'FAIL');
      const retries = phaseLogs.filter(log => log.status === 'RETRY');
      
      if (failures.length > 0) {
        issues.push({
          phase,
          issue: 'FAILURE',
          count: failures.length,
          lastError: failures[failures.length - 1]?.error,
          duration: failures[failures.length - 1]?.duration
        });
      }
      
      if (retries.length > 2) {
        issues.push({
          phase,
          issue: 'EXCESSIVE_RETRIES',
          count: retries.length,
          avgDuration: retries.reduce((sum, log) => sum + (log.duration || 0), 0) / retries.length
        });
      }
    }

    // Detectar loops (múltiplas tentativas da mesma fase sem progresso)
    const recentLogs = orderLogs.slice(-10);
    const phaseCount = recentLogs.reduce((acc, log) => {
      acc[log.phase] = (acc[log.phase] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    for (const [phase, count] of Object.entries(phaseCount)) {
      if (count > 3) {
        issues.push({
          phase,
          issue: 'POTENTIAL_LOOP',
          count,
          suggestion: `Fase ${phase} executada ${count} vezes nos últimos 10 logs`
        });
      }
    }

    return {
      found: issues.length > 0,
      issues,
      totalLogs: orderLogs.length,
      timespan: orderLogs.length > 0 ? 
        orderLogs[orderLogs.length - 1].timestamp - orderLogs[0].timestamp : 0
    };
  }

  // Métricas de performance
  getPerformanceMetrics() {
    const recentLogs = this.logs.filter(log => 
      Date.now() - log.timestamp < 10 * 60 * 1000 // Últimos 10 minutos
    );

    const successLogs = recentLogs.filter(log => log.status === 'SUCCESS');
    const failLogs = recentLogs.filter(log => log.status === 'FAIL');
    
    const avgDurationByPhase = {} as Record<string, number>;
    
    ['SECURITY', 'CLEANUP', 'VALIDATION', 'UPLOAD', 'DATABASE'].forEach(phase => {
      const phaseLogs = successLogs.filter(log => log.phase === phase && log.duration);
      if (phaseLogs.length > 0) {
        avgDurationByPhase[phase] = phaseLogs.reduce((sum, log) => sum + (log.duration || 0), 0) / phaseLogs.length;
      }
    });

    return {
      totalOperations: recentLogs.length,
      successRate: recentLogs.length > 0 ? (successLogs.length / recentLogs.length) * 100 : 0,
      failureRate: recentLogs.length > 0 ? (failLogs.length / recentLogs.length) * 100 : 0,
      avgDurationByPhase,
      mostCommonError: this.getMostCommonError(failLogs)
    };
  }

  private getMostCommonError(failLogs: UploadLogEntry[]) {
    const errorCount = failLogs.reduce((acc, log) => {
      if (log.error) {
        acc[log.error] = (acc[log.error] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const mostCommon = Object.entries(errorCount)
      .sort(([,a], [,b]) => b - a)[0];
    
    return mostCommon ? { error: mostCommon[0], count: mostCommon[1] } : null;
  }

  // Limpar logs antigos
  clearOldLogs(olderThanHours: number = 24) {
    const cutoff = Date.now() - (olderThanHours * 60 * 60 * 1000);
    const initialCount = this.logs.length;
    this.logs = this.logs.filter(log => log.timestamp > cutoff);
    
    console.log(`🧹 [LOGS] Limpeza: ${initialCount - this.logs.length} logs removidos`);
  }

  // Exportar logs para debugging
  exportLogs(orderId?: string) {
    const logsToExport = orderId ? 
      this.logs.filter(log => log.orderId === orderId) : 
      this.logs;

    return {
      exported_at: new Date().toISOString(),
      total_logs: logsToExport.length,
      logs: logsToExport
    };
  }
}

export const uploadLogger = new VideoUploadLogger();

// Helper para criar sessions de upload
export class UploadSession {
  constructor(
    private orderId: string,
    private userId: string,
    private logger: VideoUploadLogger = uploadLogger
  ) {}

  logPhaseStart(phase: UploadLogEntry['phase'], details?: any) {
    this.logger.log({
      orderId: this.orderId,
      userId: this.userId,
      phase,
      status: 'START',
      details
    });
    return Date.now(); // Retorna timestamp para medir duração
  }

  logPhaseSuccess(phase: UploadLogEntry['phase'], startTime: number, details?: any) {
    this.logger.log({
      orderId: this.orderId,
      userId: this.userId,
      phase,
      status: 'SUCCESS',
      duration: Date.now() - startTime,
      details
    });
  }

  logPhaseFailure(phase: UploadLogEntry['phase'], startTime: number, error: string, details?: any) {
    this.logger.log({
      orderId: this.orderId,
      userId: this.userId,
      phase,
      status: 'FAIL',
      duration: Date.now() - startTime,
      error,
      details
    });
  }

  logPhaseRetry(phase: UploadLogEntry['phase'], attempt: number, details?: any) {
    this.logger.log({
      orderId: this.orderId,
      userId: this.userId,
      phase,
      status: 'RETRY',
      details: { ...details, attempt }
    });
  }

  complete() {
    this.logger.log({
      orderId: this.orderId,
      userId: this.userId,
      phase: 'COMPLETE',
      status: 'SUCCESS'
    });
  }

  analyzeIssues() {
    return this.logger.analyzeUploadIssues(this.orderId);
  }
}