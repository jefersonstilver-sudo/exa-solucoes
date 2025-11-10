/**
 * Sistema robusto de logging para ações de vídeo
 * Registra toda a jornada de mudança de vídeo principal
 */

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  category: string;
  action: string;
  data: any;
  stackTrace?: string;
}

interface VideoChangeContext {
  orderId: string;
  slotId: string;
  videoId: string;
  videoTitle: string;
  buildingIds: string[];
  userId: string;
  sessionId: string;
}

class VideoActionLogger {
  private logs: LogEntry[] = [];
  private readonly MAX_LOGS = 1000;
  private readonly STORAGE_KEY = 'video_action_logs';
  private context: Partial<VideoChangeContext> = {};

  constructor() {
    this.loadLogsFromStorage();
  }

  /**
   * Define o contexto atual da ação
   */
  setContext(context: Partial<VideoChangeContext>) {
    this.context = { ...this.context, ...context };
    this.log('info', 'CONTEXT', 'Context Updated', { context: this.context });
  }

  /**
   * Limpa o contexto
   */
  clearContext() {
    this.context = {};
    this.log('info', 'CONTEXT', 'Context Cleared', {});
  }

  /**
   * Log genérico
   */
  log(
    level: 'info' | 'warn' | 'error' | 'debug',
    category: string,
    action: string,
    data: any
  ) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      action,
      data: {
        ...data,
        context: this.context
      }
    };

    // Adiciona stack trace para erros
    if (level === 'error') {
      entry.stackTrace = new Error().stack;
    }

    this.logs.push(entry);

    // Limita o tamanho do array
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(-this.MAX_LOGS);
    }

    // Log colorido no console
    this.logToConsole(entry);

    // Salva no localStorage
    this.saveLogsToStorage();
  }

  /**
   * Log específico para UI - Clique do usuário
   */
  logUserClick(slotId: string, videoTitle: string, additionalData?: any) {
    this.log('info', 'UI_USER_ACTION', 'User Clicked Set Base Video', {
      slotId,
      videoTitle,
      ...additionalData
    });
  }

  /**
   * Log específico para busca de dados
   */
  logDataFetch(step: string, query: string, result: any) {
    this.log('debug', 'DATA_FETCH', step, {
      query,
      resultCount: Array.isArray(result) ? result.length : result ? 1 : 0,
      result
    });
  }

  /**
   * Log específico para chamada de API externa
   */
  logAPICall(
    clientId: string,
    url: string,
    payload: any,
    response: { ok: boolean; status: number; statusText: string; body?: string }
  ) {
    const level = response.ok ? 'info' : 'error';
    this.log(level, 'EXTERNAL_API', 'API Call', {
      clientId,
      url,
      payload,
      response
    });
  }

  /**
   * Log específico para RPC
   */
  logRPC(rpcName: string, params: any, result: any, error?: any) {
    const level = error ? 'error' : 'info';
    this.log(level, 'RPC_CALL', rpcName, {
      params,
      result,
      error
    });
  }

  /**
   * Log de início de processo
   */
  logProcessStart(processName: string, params: any) {
    this.log('info', 'PROCESS', `${processName} - START`, params);
  }

  /**
   * Log de fim de processo
   */
  logProcessEnd(processName: string, success: boolean, result?: any, error?: any) {
    const level = success ? 'info' : 'error';
    this.log(level, 'PROCESS', `${processName} - ${success ? 'SUCCESS' : 'FAILED'}`, {
      result,
      error
    });
  }

  /**
   * Exporta logs formatados
   */
  exportLogs(filter?: { category?: string; level?: string; startTime?: string }): LogEntry[] {
    let filtered = this.logs;

    if (filter?.category) {
      filtered = filtered.filter(log => log.category === filter.category);
    }

    if (filter?.level) {
      filtered = filtered.filter(log => log.level === filter.level);
    }

    if (filter?.startTime) {
      filtered = filtered.filter(log => log.timestamp >= filter.startTime);
    }

    return filtered;
  }

  /**
   * Gera relatório de última ação
   */
  getLastActionReport(): string {
    const recent = this.logs.slice(-50);
    
    const report = recent.map(log => {
      const emoji = this.getEmojiForLevel(log.level);
      return `${emoji} [${log.timestamp}] [${log.category}] ${log.action}\n${JSON.stringify(log.data, null, 2)}`;
    }).join('\n\n' + '='.repeat(80) + '\n\n');

    return report;
  }

  /**
   * Limpa todos os logs
   */
  clearLogs() {
    this.logs = [];
    this.saveLogsToStorage();
    console.log('🧹 [LOGGER] Logs cleared');
  }

  /**
   * Salva logs no localStorage
   */
  private saveLogsToStorage() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.logs));
    } catch (error) {
      console.warn('⚠️ [LOGGER] Failed to save logs to storage:', error);
    }
  }

  /**
   * Carrega logs do localStorage
   */
  private loadLogsFromStorage() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.logs = JSON.parse(stored);
        console.log(`📚 [LOGGER] Loaded ${this.logs.length} logs from storage`);
      }
    } catch (error) {
      console.warn('⚠️ [LOGGER] Failed to load logs from storage:', error);
    }
  }

  /**
   * Log colorido no console
   */
  private logToConsole(entry: LogEntry) {
    const emoji = this.getEmojiForLevel(entry.level);
    const color = this.getColorForLevel(entry.level);
    const prefix = `${emoji} [${entry.category}] ${entry.action}`;

    if (entry.level === 'error') {
      console.error(prefix, entry.data, entry.stackTrace);
    } else if (entry.level === 'warn') {
      console.warn(prefix, entry.data);
    } else if (entry.level === 'debug') {
      console.debug(prefix, entry.data);
    } else {
      console.log(`%c${prefix}`, `color: ${color}; font-weight: bold`, entry.data);
    }
  }

  /**
   * Emoji por nível
   */
  private getEmojiForLevel(level: string): string {
    const emojis: Record<string, string> = {
      info: '📘',
      warn: '⚠️',
      error: '❌',
      debug: '🔍'
    };
    return emojis[level] || '📝';
  }

  /**
   * Cor por nível
   */
  private getColorForLevel(level: string): string {
    const colors: Record<string, string> = {
      info: '#2196F3',
      warn: '#FF9800',
      error: '#F44336',
      debug: '#9E9E9E'
    };
    return colors[level] || '#000000';
  }
}

// Singleton
export const videoLogger = new VideoActionLogger();

// Helper para criar dump completo
export const createVideoChangeDump = () => {
  const report = videoLogger.getLastActionReport();
  const blob = new Blob([report], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `video-change-log-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  console.log('💾 [LOGGER] Log dump downloaded');
};
