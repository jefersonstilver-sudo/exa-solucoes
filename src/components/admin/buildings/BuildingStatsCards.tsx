
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Building2, 
  Users,
  DollarSign,
  Monitor,
  TrendingUp,
  Calculator
} from 'lucide-react';

interface BuildingStatsCardsProps {
  stats: {
    total: number;
    active: number;
    inactive: number;
    totalTraffic: number;
    totalUnits: number;
    totalPublic: number;
    averagePrice: number;
    totalScreens: number;
    totalViews: number;
  };
}

const BuildingStatsCards: React.FC<BuildingStatsCardsProps> = ({ stats }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">prédios</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ativos</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          <p className="text-xs text-green-600">operacionais</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Unidades</CardTitle>
          <Users className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats.totalUnits}</div>
          <p className="text-xs text-blue-600">apartamentos</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Público</CardTitle>
          <Users className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">{stats.totalPublic}</div>
          <p className="text-xs text-purple-600">pessoas</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Painéis</CardTitle>
          <Monitor className="h-4 w-4 text-indigo-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-indigo-600">{stats.totalScreens}</div>
          <p className="text-xs text-indigo-600">telas ativas</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Visualizações</CardTitle>
          <Calculator className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold text-orange-600">{stats.totalViews.toLocaleString()}</div>
          <p className="text-xs text-orange-600">por mês</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Preço Médio</CardTitle>
          <DollarSign className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold text-green-600">{formatPrice(stats.averagePrice)}</div>
          <p className="text-xs text-green-600">média</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tráfego</CardTitle>
          <TrendingUp className="h-4 w-4 text-cyan-600" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold text-cyan-600">{stats.totalTraffic.toLocaleString()}</div>
          <p className="text-xs text-cyan-600">mensal</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default BuildingStatsCards;
