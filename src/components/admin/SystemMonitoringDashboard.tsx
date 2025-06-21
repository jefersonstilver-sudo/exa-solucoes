
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSystemMonitoring } from '@/hooks/useSystemMonitoring';
import { toast } from 'sonner';

interface SystemStats {
  totalOrders: number;
  pendingOrders: number;
  expiredOrders: number;
  paidOrders: number;
  cancelledOrders: number;
  lastCancellation: string | null;
}

const SystemMonitoringDashboard = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const { isMonitoring, lastCheck, manualCheck } = useSystemMonitoring();

  useEffect(() => {
    loadSystemStats();
    
    // Atualizar stats a cada 30 segundos
    const interval = setInterval(loadSystemStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadSystemStats = async () => {
    try {
      setIsLoadingStats(true);

      // Buscar estatísticas do sistema
      const { data, error } = await supabase
        .from('pedidos')
        .select('status, created_at')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const stats: SystemStats = {
        totalOrders: data.length,
        pendingOrders: data.filter(p => 
          p.status === 'pendente' && new Date(p.created_at) > last24Hours
        ).length,
        expiredOrders: data.filter(p => 
          p.status === 'pendente' && new Date(p.created_at) <= last24Hours
        ).length,
        paidOrders: data.filter(p => 
          ['pago_pendente_video', 'video_enviado', 'video_aprovado'].includes(p.status)
        ).length,
        cancelledOrders: data.filter(p => 
          p.status === 'cancelado_automaticamente'
        ).length,
        lastCancellation: null
      };

      setStats(stats);

    } catch (error: any) {
      console.error('Erro ao carregar stats:', error);
      toast.error('Erro ao carregar estatísticas do sistema');
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleManualCancellation = async () => {
    try {
      toast.info('Executando cancelamento manual...');
      await manualCheck();
      await loadSystemStats();
      toast.success('Cancelamento executado com sucesso!');
    } catch (error) {
      toast.error('Erro ao executar cancelamento manual');
    }
  };

  if (isLoadingStats && !stats) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Monitoramento do Sistema</h1>
          <p className="text-gray-600">Status em tempo real dos pagamentos e pedidos</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {lastCheck && (
            <div className="text-sm text-gray-500">
              Última verificação: {lastCheck.toLocaleTimeString()}
            </div>
          )}
          <Button 
            onClick={handleManualCancellation}
            disabled={isMonitoring}
            size="sm"
          >
            {isMonitoring ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Executando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Executar Limpeza
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingOrders || 0}</div>
            <p className="text-xs text-muted-foreground">Últimas 24 horas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Expirados</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.expiredOrders || 0}</div>
            <p className="text-xs text-muted-foreground">Precisam ser cancelados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Pagos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.paidOrders || 0}</div>
            <p className="text-xs text-muted-foreground">Última semana</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelados Auto</CardTitle>
            <Shield className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.cancelledOrders || 0}</div>
            <p className="text-xs text-muted-foreground">Sistema automático</p>
          </CardContent>
        </Card>
      </div>

      {/* Status do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Status de Segurança</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Cancelamento Automático</span>
            <Badge variant={isMonitoring ? "secondary" : "default"}>
              {isMonitoring ? "Executando" : "Ativo"}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Validação de Acesso</span>
            <Badge variant="default">Ativo</Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Webhook MercadoPago</span>
            <Badge variant="default">Configurado</Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Pedidos Órfãos</span>
            <Badge variant={stats?.expiredOrders === 0 ? "default" : "destructive"}>
              {stats?.expiredOrders === 0 ? "Limpo" : `${stats?.expiredOrders} encontrados`}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Alertas */}
      {stats && stats.expiredOrders > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <span>Ação Necessária</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 mb-4">
              Existem {stats.expiredOrders} pedidos que precisam ser cancelados automaticamente.
              Execute a limpeza para manter o sistema íntegro.
            </p>
            <Button 
              onClick={handleManualCancellation}
              disabled={isMonitoring}
              variant="destructive"
              size="sm"
            >
              {isMonitoring ? "Executando..." : "Cancelar Pedidos Expirados"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SystemMonitoringDashboard;
