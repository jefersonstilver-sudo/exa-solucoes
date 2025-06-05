
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, RefreshCw, TrendingUp, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface FinancialStats {
  supabase_total: number;
  webhook_count: number;
  missing_webhooks: number;
  reconciliation_status: string;
  anomaly_score: number;
  status: string;
}

interface AnomaliesData {
  duplicate_orders: number;
  zero_value_orders: number;
  suspicious_timing: number;
  missing_payment_logs: number;
  anomaly_score: number;
  status: string;
}

interface AuditResult {
  success: boolean;
  duplicates_fixed: number;
  orphaned_attempts_migrated: number;
  total_corrected_value: number;
  final_june_total: number;
}

const FinancialIntegrityDashboard: React.FC = () => {
  const [stats, setStats] = useState<FinancialStats | null>(null);
  const [anomalies, setAnomalies] = useState<AnomaliesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      
      // Executar reconciliação diária
      const { data: reconciliation, error: reconError } = await supabase
        .rpc('daily_financial_reconciliation');
      
      if (reconError) {
        console.error('Erro na reconciliação:', reconError);
        toast.error('Erro ao executar reconciliação financeira');
        return;
      }

      // Detectar anomalias
      const { data: anomaliesData, error: anomaliesError } = await supabase
        .rpc('detect_financial_anomalies');
      
      if (anomaliesError) {
        console.error('Erro na detecção de anomalias:', anomaliesError);
        toast.error('Erro ao detectar anomalias financeiras');
        return;
      }

      // Type casting para garantir compatibilidade
      setStats(reconciliation as FinancialStats);
      setAnomalies(anomaliesData as AnomaliesData);
      setLastUpdate(new Date().toLocaleString('pt-BR'));
      
      console.log('📊 Dados financeiros atualizados:', {
        reconciliation,
        anomalies: anomaliesData
      });

    } catch (error) {
      console.error('Erro ao buscar dados financeiros:', error);
      toast.error('Erro ao carregar dashboard financeiro');
    } finally {
      setLoading(false);
    }
  };

  const runEmergencyAudit = async () => {
    try {
      setLoading(true);
      toast.loading('Executando auditoria emergencial...');
      
      const { data: auditResult, error } = await supabase
        .rpc('emergency_financial_audit_and_fix');
      
      if (error) {
        console.error('Erro na auditoria emergencial:', error);
        toast.error('Erro ao executar auditoria emergencial');
        return;
      }

      console.log('🔧 Resultado da auditoria emergencial:', auditResult);
      
      // Type casting para garantir acesso às propriedades
      const result = auditResult as AuditResult;
      
      toast.success(`Auditoria concluída: ${result.duplicates_fixed} duplicados corrigidos, ${result.orphaned_attempts_migrated} tentativas migradas`);
      
      // Atualizar dados após auditoria
      await fetchFinancialData();
      
    } catch (error) {
      console.error('Erro na auditoria emergencial:', error);
      toast.error('Erro ao executar auditoria emergencial');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
    
    // Atualizar a cada 5 minutos
    const interval = setInterval(fetchFinancialData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OK':
      case 'HEALTHY':
        return 'bg-green-100 text-green-800';
      case 'WARNING':
        return 'bg-yellow-100 text-yellow-800';
      case 'ERROR':
      case 'CRITICAL':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OK':
      case 'HEALTHY':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'WARNING':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'ERROR':
      case 'CRITICAL':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading && !stats) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Carregando dashboard de integridade financeira...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Integridade Financeira</h2>
          <p className="text-gray-600">Monitoramento em tempo real da saúde financeira do sistema</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={fetchFinancialData} 
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button 
            onClick={runEmergencyAudit}
            disabled={loading}
            variant="destructive"
            size="sm"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Auditoria Emergencial
          </Button>
        </div>
      </div>

      {lastUpdate && (
        <p className="text-sm text-gray-500">
          Última atualização: {lastUpdate}
        </p>
      )}

      {/* Cards de Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status de Reconciliação</CardTitle>
            {stats && getStatusIcon(stats.reconciliation_status)}
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats && (
                <Badge className={getStatusColor(stats.reconciliation_status)}>
                  {stats.reconciliation_status}
                </Badge>
              )}
              <p className="text-xs text-gray-600">
                Comparação Supabase vs Webhooks
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hoje</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                R$ {stats?.supabase_total?.toFixed(2) || '0,00'}
              </div>
              <p className="text-xs text-gray-600">
                Pagamentos confirmados
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Webhooks</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {stats?.webhook_count || 0}
              </div>
              <p className="text-xs text-gray-600">
                Webhooks recebidos hoje
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score de Anomalias</CardTitle>
            {anomalies && getStatusIcon(anomalies.status)}
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {anomalies?.anomaly_score || 0}
              </div>
              {anomalies && (
                <Badge className={getStatusColor(anomalies.status)}>
                  {anomalies.status}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detalhes das Anomalias */}
      {anomalies && anomalies.anomaly_score > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
              Anomalias Detectadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {anomalies.duplicate_orders}
                </div>
                <p className="text-sm text-gray-600">Pedidos Duplicados</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {anomalies.zero_value_orders}
                </div>
                <p className="text-sm text-gray-600">Valores Inválidos</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {anomalies.suspicious_timing}
                </div>
                <p className="text-sm text-gray-600">Timing Suspeito</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {anomalies.missing_payment_logs}
                </div>
                <p className="text-sm text-gray-600">Logs Ausentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Webhooks Ausentes */}
      {stats && stats.missing_webhooks > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-yellow-700">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Alerta: Webhooks Ausentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">
              {stats.missing_webhooks} pedido(s) confirmado(s) sem webhook correspondente do MercadoPago.
              Isso pode indicar pagamentos processados fora do fluxo padrão.
            </p>
            <Button 
              onClick={runEmergencyAudit} 
              className="mt-3" 
              variant="outline"
              disabled={loading}
            >
              Investigar e Corrigir
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FinancialIntegrityDashboard;
