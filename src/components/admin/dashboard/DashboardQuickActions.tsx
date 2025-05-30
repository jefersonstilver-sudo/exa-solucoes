
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Building2, ShoppingBag, MonitorPlay, Zap } from 'lucide-react';
import { MonthlyDashboardStats } from '@/hooks/useMonthlyDashboardData';

interface DashboardQuickActionsProps {
  stats: MonthlyDashboardStats;
}

const DashboardQuickActions = ({ stats }: DashboardQuickActionsProps) => {
  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Zap className="h-5 w-5 mr-3 text-indexa-purple" />
          Ações Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button className="w-full justify-start bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg">
          <Users className="h-4 w-4 mr-3" />
          Gerenciar Usuários ({stats.total_users_accumulated || 0})
        </Button>
        <Button variant="outline" className="w-full justify-start shadow-sm hover:shadow-md transition-shadow">
          <Building2 className="h-4 w-4 mr-3" />
          Gerenciar Prédios ({stats.total_buildings_accumulated || 0})
        </Button>
        <Button variant="outline" className="w-full justify-start shadow-sm hover:shadow-md transition-shadow">
          <ShoppingBag className="h-4 w-4 mr-3" />
          Ver Pedidos ({stats.total_orders || 0})
        </Button>
        <Button variant="outline" className="w-full justify-start shadow-sm hover:shadow-md transition-shadow">
          <MonitorPlay className="h-4 w-4 mr-3" />
          Monitorar Painéis ({stats.total_panels_accumulated || 0})
        </Button>
      </CardContent>
    </Card>
  );
};

export default DashboardQuickActions;
