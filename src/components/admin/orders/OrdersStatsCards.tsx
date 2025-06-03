
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertTriangle, Clock, Calendar, DollarSign, TrendingUp } from 'lucide-react';

interface OrdersStatsCardsProps {
  stats: {
    total_orders: number;
    total_attempts: number;
    total_revenue: number;
    conversion_rate: number;
    abandoned_value: number;
  };
}

const OrdersStatsCards: React.FC<OrdersStatsCardsProps> = ({ stats }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {/* Total de Pedidos */}
      <Card className="bg-white border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">
            Total de Pedidos
          </CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{stats.total_orders}</div>
          <p className="text-xs text-gray-600 mt-1">
            Pedidos finalizados
          </p>
        </CardContent>
      </Card>

      {/* Receita Total */}
      <Card className="bg-white border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">
            Receita Total
          </CardTitle>
          <DollarSign className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(stats.total_revenue)}
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Pagamentos confirmados
          </p>
        </CardContent>
      </Card>

      {/* Taxa de Conversão */}
      <Card className="bg-white border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">
            Taxa de Conversão
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {stats.conversion_rate.toFixed(1)}%
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Tentativas → Pedidos
          </p>
        </CardContent>
      </Card>

      {/* Tentativas Abandonadas */}
      <Card className="bg-white border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">
            Tentativas
          </CardTitle>
          <AlertTriangle className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{stats.total_attempts}</div>
          <p className="text-xs text-gray-600 mt-1">
            Oportunidades de CRM
          </p>
        </CardContent>
      </Card>

      {/* Valor Abandonado */}
      <Card className="bg-white border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">
            Valor Abandonado
          </CardTitle>
          <Clock className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(stats.abandoned_value)}
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Potencial perdido
          </p>
        </CardContent>
      </Card>

      {/* Pedidos Ativos */}
      <Card className="bg-white border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">
            Campanhas Ativas
          </CardTitle>
          <Calendar className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {/* Esta métrica será calculada dinamicamente pelas abas */}
            --
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Em exibição
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrdersStatsCards;
