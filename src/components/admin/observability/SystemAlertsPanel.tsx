import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  Check, 
  Clock,
  Loader2
} from 'lucide-react';
import { SystemAlert } from '@/hooks/useObservabilityData';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { UseMutationResult } from '@tanstack/react-query';

interface SystemAlertsPanelProps {
  alerts: SystemAlert[];
  isLoading: boolean;
  acknowledgeAlert: UseMutationResult<void, Error, string, unknown>;
  showOnlyActive?: boolean;
}

export const SystemAlertsPanel: React.FC<SystemAlertsPanelProps> = ({
  alerts,
  isLoading,
  acknowledgeAlert,
  showOnlyActive = false,
}) => {
  const filteredAlerts = showOnlyActive 
    ? alerts.filter(a => !a.acknowledged) 
    : alerts;

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case 'info':
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive" className="text-xs">Crítico</Badge>;
      case 'warning':
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">Aviso</Badge>;
      case 'info':
      default:
        return <Badge variant="secondary" className="text-xs">Info</Badge>;
    }
  };

  const getAlertTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'delivery_failed': 'Falha de Entrega',
      'circuit_breaker_open': 'Circuit Breaker Aberto',
      'agent_offline': 'Agente Offline',
      'high_error_rate': 'Taxa de Erro Alta',
      'system_error': 'Erro de Sistema',
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Alertas do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Alertas do Sistema
            {filteredAlerts.filter(a => !a.acknowledged).length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {filteredAlerts.filter(a => !a.acknowledged).length}
              </Badge>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <Check className="h-10 w-10 text-green-500 mb-2" />
            <p className="text-sm">Nenhum alerta {showOnlyActive ? 'ativo' : ''}</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border transition-all ${
                    alert.acknowledged
                      ? 'bg-muted/30 border-border opacity-60'
                      : 'bg-card border-border hover:border-primary/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {getSeverityIcon(alert.severity)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">
                            {alert.title || getAlertTypeLabel(alert.type)}
                          </span>
                          {getSeverityBadge(alert.severity)}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 break-words">
                          {alert.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            {formatDistanceToNow(new Date(alert.created_at), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    {!alert.acknowledged && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => acknowledgeAlert.mutate(alert.id)}
                        disabled={acknowledgeAlert.isPending}
                        className="shrink-0"
                      >
                        {acknowledgeAlert.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        <span className="ml-1 hidden sm:inline">Reconhecer</span>
                      </Button>
                    )}
                  </div>
                  {alert.acknowledged && (
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      Reconhecido em{' '}
                      {alert.acknowledged_at
                        ? formatDistanceToNow(new Date(alert.acknowledged_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })
                        : 'data desconhecida'}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
