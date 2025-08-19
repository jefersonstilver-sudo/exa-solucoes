import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Building2, ShoppingBag, MonitorPlay, Zap } from 'lucide-react';
import { MonthlyDashboardStats } from '@/hooks/useMonthlyDashboardData';
interface DashboardQuickActionsProps {
  stats: MonthlyDashboardStats;
}
const DashboardQuickActions = ({
  stats
}: DashboardQuickActionsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Ações Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button variant="outline" className="w-full justify-start">
          <Users className="h-4 w-4 mr-2" />
          Gerenciar Usuários ({stats.total_users})
        </Button>
        <Button variant="outline" className="w-full justify-start">
          <Building2 className="h-4 w-4 mr-2" />
          Gerenciar Prédios
        </Button>
        <Button variant="outline" className="w-full justify-start">
          <ShoppingBag className="h-4 w-4 mr-2" />
          Ver Pedidos ({stats.total_orders})
        </Button>
        <Button variant="outline" className="w-full justify-start">
          <MonitorPlay className="h-4 w-4 mr-2" />
          Status Painéis ({stats.online_panels}/{stats.total_panels_accumulated})
        </Button>
      </CardContent>
    </Card>
  );
};
export default DashboardQuickActions;