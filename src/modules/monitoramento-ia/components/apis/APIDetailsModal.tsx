import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, CheckCircle2, XCircle, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import { useAPILogs, APILog, APIStats } from '@/modules/monitoramento-ia/hooks/useAPILogs';
import { toast } from 'sonner';

interface APIDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiName: string;
  functionName: string;
  onTest: () => void;
  testing: boolean;
}

export const APIDetailsModal = ({ 
  open, 
  onOpenChange, 
  apiName, 
  functionName,
  onTest,
  testing
}: APIDetailsModalProps) => {
  const { fetchLogs, getStats, loading } = useAPILogs();
  const [logs, setLogs] = useState<APILog[]>([]);
  const [stats, setStats] = useState<APIStats | null>(null);

  useEffect(() => {
    if (open) {
      loadLogs();
    }
  }, [open, functionName]);

  const loadLogs = async () => {
    const fetchedLogs = await fetchLogs(functionName);
    setLogs(fetchedLogs);
    setStats(getStats(fetchedLogs));
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-500';
    if (status >= 400 && status < 500) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-module-card border-module">
        <DialogHeader>
          <DialogTitle className="text-2xl text-module-primary flex items-center gap-2">
            📊 Detalhes - {apiName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-module-input rounded-lg border border-module p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-module-tertiary text-xs">Total de Chamadas</p>
                  <TrendingUp className="w-4 h-4 text-module-accent" />
                </div>
                <p className="text-2xl font-bold text-module-primary">{stats.totalCalls}</p>
              </div>

              <div className="bg-module-input rounded-lg border border-module p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-module-tertiary text-xs">Taxa de Sucesso</p>
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                </div>
                <p className="text-2xl font-bold text-green-500">
                  {stats.successRate.toFixed(1)}%
                </p>
              </div>

              <div className="bg-module-input rounded-lg border border-module p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-module-tertiary text-xs">Latência Média</p>
                  <Clock className="w-4 h-4 text-blue-500" />
                </div>
                <p className="text-2xl font-bold text-module-primary">
                  {stats.avgLatency}ms
                </p>
              </div>

              <div className="bg-module-input rounded-lg border border-module p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-module-tertiary text-xs">Taxa de Erro</p>
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                </div>
                <p className="text-2xl font-bold text-red-500">
                  {stats.errorRate.toFixed(1)}%
                </p>
              </div>
            </div>
          )}

          {/* Test Connection */}
          <div className="flex gap-2">
            <Button 
              onClick={onTest}
              disabled={testing}
              className="flex-1 bg-module-accent hover:bg-module-accent-hover text-white"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${testing ? 'animate-spin' : ''}`} />
              {testing ? 'Testando...' : 'Testar Conexão Agora'}
            </Button>
            <Button 
              onClick={loadLogs}
              disabled={loading}
              variant="outline"
              className="border-module-accent text-module-accent hover:bg-module-accent hover:text-white"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar Logs
            </Button>
          </div>

          {/* Logs History */}
          <div className="bg-module-input rounded-lg border border-module p-4">
            <h3 className="text-lg font-bold text-module-primary mb-4">
              📝 Histórico de Chamadas (últimas {logs.length})
            </h3>
            
            <ScrollArea className="h-[400px] pr-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-module-accent" />
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-8 text-module-tertiary">
                  Nenhum log encontrado
                </div>
              ) : (
                <div className="space-y-2">
                  {logs.map((log, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between py-3 px-4 bg-module-card rounded-lg border border-module hover:border-module-accent transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {log.status >= 200 && log.status < 300 ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={log.status >= 200 && log.status < 300 ? 'default' : 'destructive'}
                              className="text-xs"
                            >
                              {log.status}
                            </Badge>
                            <span className="text-xs text-module-tertiary">
                              {formatDate(log.timestamp)}
                            </span>
                          </div>
                          {log.error && (
                            <p className="text-xs text-red-500 mt-1 truncate">
                              {log.error}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <span className={`text-sm font-mono font-bold ${getStatusColor(log.status)}`}>
                          {log.latency}ms
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
