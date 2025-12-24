import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, CheckCircle, XCircle, Eye } from 'lucide-react';

interface AuditAlert {
  id: string;
  level: 'critical' | 'warning' | 'info';
  type: string;
  message: string;
  pedido_id: string | null;
  client_name: string | null;
  order_value: number | null;
  mp_value: number | null;
  mp_payer_name: string | null;
}

interface AuditStats {
  total_orders_checked: number;
  validated: number;
  warnings: number;
  critical: number;
  integrity_percentage: number;
}

interface OrderAuditCardProps {
  stats: AuditStats | null;
  alerts: AuditAlert[];
  loading: boolean;
  onRunAudit: () => void;
  onInvestigate?: (alertId: string) => void;
}

const OrderAuditCard: React.FC<OrderAuditCardProps> = ({
  stats,
  alerts,
  loading,
  onRunAudit,
  onInvestigate
}) => {
  const getIntegrityColor = (percentage: number) => {
    if (percentage >= 95) return 'text-emerald-600';
    if (percentage >= 80) return 'text-amber-600';
    return 'text-red-600';
  };

  const getIntegrityBg = (percentage: number) => {
    if (percentage >= 95) return 'bg-emerald-100';
    if (percentage >= 80) return 'bg-amber-100';
    return 'bg-red-100';
  };

  const criticalAlerts = alerts.filter(a => a.level === 'critical');
  const warningAlerts = alerts.filter(a => a.level === 'warning');

  return (
    <Card className="border-2 border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-primary" />
            Auditoria Anti-Fraude
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={onRunAudit}
            disabled={loading}
          >
            {loading ? 'Auditando...' : 'Executar Auditoria'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold text-foreground">{stats?.total_orders_checked || 0}</p>
            <p className="text-xs text-muted-foreground">Verificados</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-emerald-50">
            <p className="text-2xl font-bold text-emerald-600">{stats?.validated || 0}</p>
            <p className="text-xs text-muted-foreground">Validados</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-amber-50">
            <p className="text-2xl font-bold text-amber-600">{stats?.warnings || 0}</p>
            <p className="text-xs text-muted-foreground">Atenção</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-red-50">
            <p className="text-2xl font-bold text-red-600">{stats?.critical || 0}</p>
            <p className="text-xs text-muted-foreground">Críticos</p>
          </div>
        </div>

        {/* Integrity Score */}
        <div className={`p-4 rounded-lg ${getIntegrityBg(stats?.integrity_percentage || 100)}`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Integridade Financeira</span>
            <span className={`text-2xl font-bold ${getIntegrityColor(stats?.integrity_percentage || 100)}`}>
              {stats?.integrity_percentage || 100}%
            </span>
          </div>
        </div>

        {/* Critical Alerts */}
        {criticalAlerts.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-red-600 flex items-center gap-1">
              <XCircle className="h-4 w-4" />
              Alertas Críticos ({criticalAlerts.length})
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {criticalAlerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className="p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-red-800 truncate">
                        {alert.client_name || 'Cliente desconhecido'}
                      </p>
                      <p className="text-xs text-red-600 mt-1">{alert.message}</p>
                      {alert.order_value && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Pedido: R$ {alert.order_value.toFixed(2)}
                          {alert.mp_value && ` | MP: R$ ${alert.mp_value.toFixed(2)}`}
                        </p>
                      )}
                    </div>
                    {onInvestigate && alert.pedido_id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onInvestigate(alert.pedido_id!)}
                        className="shrink-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warning Alerts */}
        {warningAlerts.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-amber-600 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              Avisos ({warningAlerts.length})
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {warningAlerts.slice(0, 3).map((alert) => (
                <div
                  key={alert.id}
                  className="p-2 bg-amber-50 border border-amber-200 rounded-lg"
                >
                  <p className="text-xs text-amber-800">{alert.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Good */}
        {alerts.length === 0 && stats && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-emerald-600" />
            <div>
              <p className="text-sm font-medium text-emerald-800">Tudo em ordem!</p>
              <p className="text-xs text-emerald-600">Nenhuma divergência encontrada</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderAuditCard;
