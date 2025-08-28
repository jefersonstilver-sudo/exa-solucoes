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
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Ações Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
            <Users className="h-6 w-6" />
            <span className="text-sm">Gerenciar Usuários</span>
          </Button>
          <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
            <Building2 className="h-6 w-6" />
            <span className="text-sm">Cadastrar Empresa</span>
          </Button>
          <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
            <ShoppingBag className="h-6 w-6" />
            <span className="text-sm">Novos Pedidos</span>
          </Button>
          <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
            <MonitorPlay className="h-6 w-6" />
            <span className="text-sm">Monitoramento</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
export default DashboardQuickActions;