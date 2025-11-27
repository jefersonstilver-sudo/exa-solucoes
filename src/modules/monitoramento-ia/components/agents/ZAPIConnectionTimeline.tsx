import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Activity, Wifi, WifiOff, AlertTriangle } from 'lucide-react';

interface ConnectionLog {
  id: string;
  agent_key: string;
  event_type: 'connected' | 'disconnected' | 'reconnected' | 'warning';
  instance_id: string | null;
  phone: string | null;
  triggered_by: string;
  details: any;
  created_at: string;
}

interface ZAPIConnectionTimelineProps {
  agentKey: string;
  limit?: number;
}

export const ZAPIConnectionTimeline: React.FC<ZAPIConnectionTimelineProps> = ({
  agentKey,
  limit = 10,
}) => {
  const [logs, setLogs] = useState<ConnectionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [uptime, setUptime] = useState<number>(0);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 30000); // Atualizar a cada 30s
    return () => clearInterval(interval);
  }, [agentKey]);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('zapi_connection_logs')
        .select('*')
        .eq('agent_key', agentKey)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      setLogs((data || []) as ConnectionLog[]);
      calculateUptime((data || []) as ConnectionLog[]);
    } catch (error) {
      console.error('Erro ao buscar logs de conexão:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateUptime = (logs: ConnectionLog[]) => {
    if (logs.length === 0) {
      setUptime(100);
      return;
    }

    const last24h = Date.now() - 24 * 60 * 60 * 1000;
    const recentLogs = logs.filter(
      (log) => new Date(log.created_at).getTime() > last24h
    );

    const disconnections = recentLogs.filter((log) => log.event_type === 'disconnected').length;
    const totalChecks = recentLogs.length;

    if (totalChecks === 0) {
      setUptime(100);
      return;
    }

    const uptimePercentage = ((totalChecks - disconnections) / totalChecks) * 100;
    setUptime(Math.round(uptimePercentage));
  };

  const getEventConfig = (eventType: string) => {
    switch (eventType) {
      case 'connected':
      case 'reconnected':
        return {
          icon: <Wifi className="w-4 h-4 text-green-500" />,
          color: 'text-green-500',
          bg: 'bg-green-500/10',
          label: eventType === 'reconnected' ? 'Reconectou' : 'Conectou',
        };
      case 'disconnected':
        return {
          icon: <WifiOff className="w-4 h-4 text-red-500" />,
          color: 'text-red-500',
          bg: 'bg-red-500/10',
          label: 'Desconectou',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
          color: 'text-yellow-500',
          bg: 'bg-yellow-500/10',
          label: 'Alerta',
        };
      default:
        return {
          icon: <Activity className="w-4 h-4 text-muted-foreground" />,
          color: 'text-muted-foreground',
          bg: 'bg-muted',
          label: 'Evento',
        };
    }
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime).getTime();
    const end = endTime ? new Date(endTime).getTime() : Date.now();
    const diff = end - start;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Uptime Badge */}
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Uptime (24h)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-500',
                uptime >= 95 ? 'bg-green-500' : uptime >= 80 ? 'bg-yellow-500' : 'bg-red-500'
              )}
              style={{ width: `${uptime}%` }}
            />
          </div>
          <span className={cn(
            'text-sm font-bold',
            uptime >= 95 ? 'text-green-500' : uptime >= 80 ? 'text-yellow-500' : 'text-red-500'
          )}>
            {uptime}%
          </span>
        </div>
      </div>

      {/* Timeline */}
      <ScrollArea className="h-[300px] pr-4">
        <div className="space-y-2">
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nenhum evento registrado ainda
            </div>
          ) : (
            logs.map((log, index) => {
              const config = getEventConfig(log.event_type);
              const nextLog = logs[index + 1];
              const duration =
                log.event_type === 'disconnected' && nextLog
                  ? formatDuration(log.created_at, nextLog.created_at)
                  : null;

              return (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className={cn('rounded-full p-1.5', config.bg)}>
                    {config.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn('text-sm font-medium', config.color)}>
                        {config.label}
                      </span>
                      {duration && (
                        <span className="text-xs text-muted-foreground">
                          (duração: {duration})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {log.phone && (
                        <span className="text-xs text-muted-foreground">
                          • {log.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
