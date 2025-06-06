
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { FinancialStats, AnomaliesData } from './types';
import { getStatusColor, getStatusIcon } from './utils';

interface EnhancedFinancialStatsCardsProps {
  stats: FinancialStats | null;
  anomalies: AnomaliesData | null;
  reconciliationData?: {
    reconciliation_status: string;
    missing_transactions: number;
    webhook_transactions: number;
  } | null;
}

const EnhancedFinancialStatsCards: React.FC<EnhancedFinancialStatsCardsProps> = ({ 
  stats, 
  anomalies, 
  reconciliationData 
}) => {
  return (
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
            {reconciliationData && (
              <div className="text-xs text-gray-500">
                {reconciliationData.webhook_transactions} webhooks hoje
              </div>
            )}
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
            {stats?.missing_webhooks && stats.missing_webhooks > 0 && (
              <div className="text-xs text-red-500">
                -{stats.missing_webhooks} sem webhook
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Integridade de Dados</CardTitle>
          {reconciliationData ? (
            reconciliationData.missing_transactions === 0 ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            )
          ) : (
            <TrendingUp className="h-4 w-4 text-blue-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-2xl font-bold">
              {reconciliationData ? 
                (reconciliationData.missing_transactions === 0 ? '✓' : reconciliationData.missing_transactions) :
                (stats?.webhook_count || 0)
              }
            </div>
            <p className="text-xs text-gray-600">
              {reconciliationData ? 
                (reconciliationData.missing_transactions === 0 ? 'Sistema íntegro' : 'Transações perdidas') :
                'Webhooks recebidos hoje'
              }
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
            <p className="text-xs text-gray-600">
              Problemas detectados
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedFinancialStatsCards;
