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
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Ações Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button className="w-full justify-start" variant="outline">
          <Users className="h-4 w-4 mr-2" />
          Gerenciar Usuários
        </Button>
        <Button className="w-full justify-start" variant="outline">
          <Building2 className="h-4 w-4 mr-2" />
          Adicionar Prédio
        </Button>
        <Button className="w-full justify-start" variant="outline">
          <ShoppingBag className="h-4 w-4 mr-2" />
          Nova Venda
        </Button>
        <Button className="w-full justify-start" variant="outline">
          <MonitorPlay className="h-4 w-4 mr-2" />
          Configurar Painéis
        </Button>
      </CardContent>
    </Card>
  );
};
export default DashboardQuickActions;