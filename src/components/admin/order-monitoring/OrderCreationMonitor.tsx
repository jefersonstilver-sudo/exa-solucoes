
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  TrendingUp,
  Clock,
  Shield,
  Zap
} from 'lucide-react';
import { useOrderCreationMonitor } from '@/hooks/useOrderCreationMonitor';

const OrderCreationMonitor: React.FC = () => {
  const {
    isMonitoring,
    stats,
    lastValidation,
    startMonitoring,
    stopMonitoring,
    updateMonitoringStats,
    checkSystemHealth
  } = useOrderCreationMonitor();

  const [systemHealth, setSystemHealth] = useState<any>(null);

  useEffect(() => {
    // Iniciar monitoramento automaticamente
    const cleanup = startMonitoring();
    
    // Verificar saúde do sistema
    checkSystemHealth().then(setSystemHealth);

    return cleanup;
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OK':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'WARNING':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'ERRO':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600';
    if (rate >= 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Monitor de Criação de Pedidos</h2>
          <p className="text-sm text-gray-600">
            Monitoramento em tempo real para garantir criação correta de pedidos
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isMonitoring ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-sm font-medium">
              {isMonitoring ? 'Monitorando' : 'Inativo'}
            </span>
          </div>
          
          <Button
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
            variant={isMonitoring ? "destructive" : "default"}
            size="sm"
          >
            {isMonitoring ? 'Parar Monitor' : 'Iniciar Monitor'}
          </Button>
        </div>
      </div>

      {/* Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pedidos 24h</p>
                <p className="text-2xl font-bold">{stats?.totalOrders || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Taxa de Sucesso</p>
                <p className={`text-2xl font-bold ${getSuccessRateColor(stats?.successRate || 0)}`}>
                  {stats?.successRate ? `${stats.successRate.toFixed(1)}%` : '0%'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Falhas Recentes</p>
                <p className="text-2xl font-bold text-red-600">{stats?.recentFailures || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-full">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Último Pedido</p>
                <p className="text-sm font-medium">
                  {stats?.lastOrderTime 
                    ? new Date(stats.lastOrderTime).toLocaleTimeString('pt-BR')
                    : 'Nenhum'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Saúde do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2 text-blue-600" />
            Saúde do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          {systemHealth ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Badge variant={systemHealth.healthy ? "default" : "destructive"}>
                  {systemHealth.healthy ? 'Sistema Saudável' : 'Problemas Detectados'}
                </Badge>
                <Button
                  onClick={() => checkSystemHealth().then(setSystemHealth)}
                  variant="outline"
                  size="sm"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Verificar Novamente
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {systemHealth.checks?.map((check: any, index: number) => (
                  <div key={index} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                    {getStatusIcon(check.status)}
                    <div>
                      <p className="text-sm font-medium">{check.name}</p>
                      <p className="text-xs text-gray-600">{check.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Verificando saúde do sistema...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Última Validação */}
      {lastValidation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2 text-green-600" />
              Última Validação de Pedido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Badge variant={lastValidation.success ? "default" : "destructive"}>
                  {lastValidation.success ? 'Validação Aprovada' : 'Validação Falhou'}
                </Badge>
                <Badge variant={lastValidation.dataIntegrity ? "default" : "destructive"}>
                  {lastValidation.dataIntegrity ? 'Dados Íntegros' : 'Problemas nos Dados'}
                </Badge>
              </div>

              {lastValidation.errors && lastValidation.errors.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-red-700 mb-2">Erros:</h4>
                  <ul className="space-y-1">
                    {lastValidation.errors.map((error, index) => (
                      <li key={index} className="text-sm text-red-600 flex items-center">
                        <XCircle className="h-4 w-4 mr-2" />
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {lastValidation.warnings && lastValidation.warnings.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-yellow-700 mb-2">Avisos:</h4>
                  <ul className="space-y-1">
                    {lastValidation.warnings.map((warning, index) => (
                      <li key={index} className="text-sm text-yellow-600 flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OrderCreationMonitor;
