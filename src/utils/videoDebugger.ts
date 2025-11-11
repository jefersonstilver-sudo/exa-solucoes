/**
 * Sistema centralizado de logs para debug de vídeos
 */

interface VideoLog {
  timestamp: string;
  category: string;
  event: string;
  data?: any;
}

export const VideoDebugger = {
  logEvent: (category: string, event: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const log: VideoLog = {
      timestamp,
      category,
      event,
      data
    };
    
    console.log(`[${category}] ${event}`, data || '');
    
    // Salvar em sessionStorage para debug
    try {
      const logs = JSON.parse(sessionStorage.getItem('video_logs') || '[]');
      logs.push(log);
      if (logs.length > 100) logs.shift(); // Manter apenas últimos 100
      sessionStorage.setItem('video_logs', JSON.stringify(logs));
    } catch (err) {
      console.error('Erro ao salvar log:', err);
    }
  },
  
  exportLogs: () => {
    const logs = sessionStorage.getItem('video_logs');
    const blob = new Blob([logs || '[]'], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `video-logs-${Date.now()}.json`;
    a.click();
    console.log('✅ Logs exportados com sucesso');
  },
  
  clearLogs: () => {
    sessionStorage.removeItem('video_logs');
    console.log('🗑️ Logs limpos');
  },
  
  getLogs: () => {
    return JSON.parse(sessionStorage.getItem('video_logs') || '[]');
  }
};

// Expor globalmente para debug via console
if (typeof window !== 'undefined') {
  (window as any).exportVideoLogs = VideoDebugger.exportLogs;
  (window as any).clearVideoLogs = VideoDebugger.clearLogs;
  (window as any).getVideoLogs = VideoDebugger.getLogs;
  
  console.log('📹 Video Debug: exportVideoLogs() | clearVideoLogs() | getVideoLogs()');
}
