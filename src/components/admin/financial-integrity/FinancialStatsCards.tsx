
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp } from 'lucide-react';
import { FinancialStats, AnomaliesData } from './types';
import { getStatusColor, getStatusIcon } from './utils';

interface FinancialStatsCardsProps {
  stats: FinancialStats | null;
  anomalies: AnomaliesData | null;
}

const FinancialStatsCards: React.FC<FinancialStatsCardsProps> = ({ stats, anomalies }) => {
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
  );
};

export default FinancialStatsCards;
