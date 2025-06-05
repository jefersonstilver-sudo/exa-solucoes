
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { AnomaliesData } from './types';

interface AnomaliesCardProps {
  anomalies: AnomaliesData | null;
}

const AnomaliesCard: React.FC<AnomaliesCardProps> = ({ anomalies }) => {
  if (!anomalies || anomalies.anomaly_score === 0) {
    return null;
  }

  return (
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
  );
};

export default AnomaliesCard;
