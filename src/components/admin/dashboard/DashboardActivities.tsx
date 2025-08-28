import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, Activity, User, Shield, AlertTriangle, Info, AlertCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useActivityFeed } from '@/hooks/useActivityFeed';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MonthlyDashboardStats } from '@/hooks/useMonthlyDashboardData';

interface DashboardActivitiesProps {
  stats: MonthlyDashboardStats;
}

const DashboardActivities = ({ stats }: DashboardActivitiesProps) => {
  const { activities, loading, error, refetch } = useActivityFeed(30);

  const getActivityIcon = (activityType: string, severity: string) => {
    if (severity === 'critical') return <AlertCircle className="h-4 w-4 text-red-500" />;
    if (severity === 'error') return <AlertTriangle className="h-4 w-4 text-red-400" />;
    if (severity === 'warning') return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    
    switch (activityType) {
      case 'admin_action':
        return <Shield className="h-4 w-4 text-blue-500" />;
      case 'user_action':
        return <User className="h-4 w-4 text-green-500" />;
      case 'system_event':
        return <Zap className="h-4 w-4 text-purple-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'error':
        return 'destructive';
      case 'warning':
        return 'secondary';
      case 'info':
      default:
        return 'outline';
    }
  };

  const getActionLabel = (action: string) => {
    const actionLabels: Record<string, string> = {
      'login': 'Login realizado',
      'logout': 'Logout realizado',
      'video_approved': 'Vídeo aprovado',
      'video_rejected': 'Vídeo rejeitado',
      'order_created': 'Pedido criado',
      'order_paid': 'Pedido pago',
      'order_blocked': 'Pedido bloqueado',
      'user_registered': 'Usuário registrado',
      'building_created': 'Prédio criado',
      'panel_sync': 'Painel sincronizado',
      'webhook_received': 'Webhook recebido',
      'system_monitoring_initialized': 'Sistema de monitoramento inicializado',
    };
    return actionLabels[action] || action;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'agora';
    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h`;
    return format(date, 'dd/MM HH:mm', { locale: ptBR });
  };

  if (error) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Atividades Recentes
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-red-600 mb-4">Erro ao carregar atividades</p>
          <Button onClick={refetch} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Monitor de Atividades
            {loading && <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />}
          </span>
          <Button onClick={refetch} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma atividade recente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-gray-50/50 hover:bg-gray-100/50 transition-colors"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getActivityIcon(activity.activity_type, activity.severity)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {getActionLabel(activity.action)}
                      </p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge 
                          variant={getSeverityColor(activity.severity)}
                          className="text-xs"
                        >
                          {activity.severity}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(activity.created_at)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="font-medium">
                        {activity.user_name === 'Sistema' ? 'Sistema' : activity.user_email}
                      </span>
                      {activity.entity_type && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{activity.entity_type}</span>
                        </>
                      )}
                    </div>
                    
                    {activity.details && Object.keys(activity.details).length > 0 && (
                      <div className="mt-1 text-xs text-gray-500">
                        {activity.details.message && (
                          <p>{activity.details.message}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{activities.length} atividades recentes</span>
            <span>🟢 Tempo real ativo</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardActivities;