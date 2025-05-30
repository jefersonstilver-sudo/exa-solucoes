
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Package, 
  DollarSign, 
  AlertTriangle, 
  TrendingUp, 
  Target,
  ShoppingCart
} from 'lucide-react';

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

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold text-gray-800">Pedidos Finalizados</CardTitle>
          <Package className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{stats.total_orders}</div>
          <p className="text-xs text-green-600 font-medium">pedidos completos</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold text-gray-800">Tentativas Abandonadas</CardTitle>
          <AlertTriangle className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{stats.total_attempts}</div>
          <p className="text-xs text-orange-600 font-medium">não finalizadas</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-indexa-purple/20 to-indexa-purple/10 border-indexa-purple/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold text-gray-800">Receita Total</CardTitle>
          <DollarSign className="h-4 w-4 text-indexa-purple" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(stats.total_revenue)}
          </div>
          <p className="text-xs text-indexa-purple font-medium">realizada</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold text-gray-800">Valor Perdido</CardTitle>
          <ShoppingCart className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(stats.abandoned_value)}
          </div>
          <p className="text-xs text-red-600 font-medium">em tentativas</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold text-gray-800">Taxa Conversão</CardTitle>
          <Target className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {formatPercentage(stats.conversion_rate)}
          </div>
          <p className="text-xs text-blue-600 font-medium">finalizadas</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold text-gray-800">Total Tentativas</CardTitle>
          <TrendingUp className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {stats.total_orders + stats.total_attempts}
          </div>
          <p className="text-xs text-purple-600 font-medium">total de ações</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrdersStatsCards;
