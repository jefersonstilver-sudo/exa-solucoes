
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Shield, 
  Users, 
  Wrench,
  Database,
  AlertCircle,
  PlayCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SystemHealth {
  health_score: number;
  status: string;
  issues: string[];
  diagnosis: {
    auth_users_count: number;
    public_users_count: number;
    orphaned_users_count: number;
    duplicate_emails_count: number;
    id_conflicts_count: number;
    system_healthy: boolean;
  };
  recommendations: string[];
}

interface AutoRecoveryResult {
  success: boolean;
  system_ready: boolean;
  message?: string;
  [key: string]: any;
}

const SystemHealthDashboard: React.FC = () => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [recovering, setRecovering] = useState(false);

  const runDiagnostic = async () => {
    try {
      setLoading(true);
      console.log('🔍 [SYSTEM HEALTH] Executando diagnóstico completo...');

      const { data, error } = await supabase.rpc('monitor_system_health');

      if (error) {
        console.error('❌ [SYSTEM HEALTH] Erro no diagnóstico:', error);
        toast.error('Erro ao executar diagnóstico');
        return;
      }

      console.log('✅ [SYSTEM HEALTH] Diagnóstico concluído:', data);
      // Type assertion with proper validation
      const healthData = data as SystemHealth;
      setSystemHealth(healthData);
      
      const status = healthData.status;
      if (status === 'HEALTHY') {
        toast.success('Sistema saudável!');
      } else if (status === 'WARNING') {
        toast.warning('Sistema com avisos - verificar recomendações');
      } else if (status === 'CRITICAL') {
        toast.error('Sistema crítico - ação imediata necessária');
      } else {
        toast.error('Sistema em emergência - executar recuperação');
      }
    } catch (error) {
      console.error('💥 [SYSTEM HEALTH] Erro crítico:', error);
      toast.error('Erro crítico no diagnóstico');
    } finally {
      setLoading(false);
    }
  };

  const runAutoRecovery = async () => {
    try {
      setRecovering(true);
      console.log('🔧 [AUTO RECOVERY] Iniciando recuperação automática...');

      const { data, error } = await supabase.rpc('auto_recovery_system');

      if (error) {
        console.error('❌ [AUTO RECOVERY] Erro na recuperação:', error);
        toast.error('Erro na recuperação automática');
        return;
      }

      console.log('✅ [AUTO RECOVERY] Recuperação concluída:', data);
      
      // Type assertion for auto recovery result
      const recoveryResult = data as AutoRecoveryResult;
      
      if (recoveryResult.system_ready) {
        toast.success('Sistema recuperado com sucesso!');
      } else {
        toast.warning('Recuperação parcial - pode necessitar intervenção manual');
      }

      // Executar novo diagnóstico
      await runDiagnostic();
    } catch (error) {
      console.error('💥 [AUTO RECOVERY] Erro crítico:', error);
      toast.error('Erro crítico na recuperação');
    } finally {
      setRecovering(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'WARNING':
        return <AlertTriangle className="h-6 w-6 text-yellow-600" />;
      case 'CRITICAL':
        return <AlertCircle className="h-6 w-6 text-red-600" />;
      case 'EMERGENCY':
        return <AlertTriangle className="h-6 w-6 text-red-700" />;
      default:
        return <Activity className="h-6 w-6 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'WARNING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'EMERGENCY':
        return 'bg-red-200 text-red-900 border-red-400';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Shield className="h-6 w-6 mr-2 text-indexa-purple" />
            Diagnóstico do Sistema de Usuários
          </h2>
          <p className="text-gray-600 mt-1">
            Monitoramento e correção automática de problemas
          </p>
        </div>
        <div className="flex space-x-3">
          <Button 
            onClick={runDiagnostic}
            disabled={loading}
            variant="outline"
            className="flex items-center"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Activity className="h-4 w-4 mr-2" />
            )}
            Executar Diagnóstico
          </Button>
          {systemHealth && systemHealth.health_score < 90 && (
            <Button 
              onClick={runAutoRecovery}
              disabled={recovering}
              className="bg-indexa-purple hover:bg-indexa-purple/90 flex items-center"
            >
              {recovering ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Wrench className="h-4 w-4 mr-2" />
              )}
              Recuperação Automática
            </Button>
          )}
        </div>
      </div>

      {/* Status Geral */}
      {systemHealth && (
        <Card className="border-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center text-xl">
                {getStatusIcon(systemHealth.status)}
                <span className="ml-2">Status do Sistema</span>
              </CardTitle>
              <Badge className={getStatusColor(systemHealth.status)}>
                {systemHealth.status} - Score: {systemHealth.health_score}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {systemHealth.status === 'HEALTHY' ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Sistema Saudável</AlertTitle>
                <AlertDescription className="text-green-700">
                  Todos os componentes estão funcionando corretamente. 
                  Criação de contas administrativas disponível.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertTitle className="text-red-800">Problemas Detectados</AlertTitle>
                <AlertDescription className="text-red-700">
                  {systemHealth.issues.length > 0 ? (
                    <ul className="list-disc list-inside mt-2">
                      {systemHealth.issues.map((issue, index) => (
                        <li key={index}>{issue}</li>
                      ))}
                    </ul>
                  ) : (
                    'Problemas detectados no sistema de usuários.'
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Estatísticas Detalhadas */}
      {systemHealth?.diagnosis && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários Auth</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {systemHealth.diagnosis.auth_users_count}
              </div>
              <p className="text-xs text-gray-500 mt-1">na tabela auth.users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários Públicos</CardTitle>
              <Database className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {systemHealth.diagnosis.public_users_count}
              </div>
              <p className="text-xs text-gray-500 mt-1">na tabela public.users</p>
            </CardContent>
          </Card>

          <Card className={systemHealth.diagnosis.orphaned_users_count > 0 ? 'border-red-200 bg-red-50' : ''}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Registros Órfãos</CardTitle>
              <AlertTriangle className={`h-4 w-4 ${systemHealth.diagnosis.orphaned_users_count > 0 ? 'text-red-500' : 'text-gray-400'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${systemHealth.diagnosis.orphaned_users_count > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                {systemHealth.diagnosis.orphaned_users_count}
              </div>
              <p className="text-xs text-gray-500 mt-1">registros problemáticos</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Conflitos Específicos */}
      {systemHealth?.diagnosis && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className={systemHealth.diagnosis.duplicate_emails_count > 0 ? 'border-yellow-200 bg-yellow-50' : ''}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <AlertCircle className={`h-5 w-5 mr-2 ${systemHealth.diagnosis.duplicate_emails_count > 0 ? 'text-yellow-600' : 'text-gray-400'}`} />
                Emails Duplicados
              </CardTitle>
              <CardDescription>
                Emails que aparecem múltiplas vezes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${systemHealth.diagnosis.duplicate_emails_count > 0 ? 'text-yellow-600' : 'text-gray-600'}`}>
                {systemHealth.diagnosis.duplicate_emails_count}
              </div>
              {systemHealth.diagnosis.duplicate_emails_count > 0 && (
                <p className="text-sm text-yellow-700 mt-2">
                  Requer intervenção manual para resolver
                </p>
              )}
            </CardContent>
          </Card>

          <Card className={systemHealth.diagnosis.id_conflicts_count > 0 ? 'border-red-200 bg-red-50' : ''}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <AlertTriangle className={`h-5 w-5 mr-2 ${systemHealth.diagnosis.id_conflicts_count > 0 ? 'text-red-600' : 'text-gray-400'}`} />
                Conflitos de ID
              </CardTitle>
              <CardDescription>
                IDs com emails diferentes entre tabelas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${systemHealth.diagnosis.id_conflicts_count > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                {systemHealth.diagnosis.id_conflicts_count}
              </div>
              {systemHealth.diagnosis.id_conflicts_count > 0 && (
                <p className="text-sm text-red-700 mt-2">
                  Problema crítico - requer correção imediata
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recomendações */}
      {systemHealth?.recommendations && systemHealth.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PlayCircle className="h-5 w-5 mr-2 text-indexa-purple" />
              Recomendações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {systemHealth.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start">
                  <div className="w-2 h-2 bg-indexa-purple rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">{recommendation}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Instruções */}
      {!systemHealth && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">Como usar este diagnóstico</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700">
            <ol className="list-decimal list-inside space-y-2">
              <li>Clique em "Executar Diagnóstico" para verificar a saúde do sistema</li>
              <li>Se problemas forem detectados, use "Recuperação Automática"</li>
              <li>Após a recuperação, teste a criação de novas contas administrativas</li>
              <li>Monitore regularmente para prevenir futuros problemas</li>
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SystemHealthDashboard;
