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
        <CardTitle className="flex items-center gap-2 text-base md:text-lg">
          <Zap className="h-4 w-4 md:h-5 md:w-5" />
          Ações Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          <Button variant="outline" className="h-auto p-3 md:p-4 flex flex-col items-center gap-2 touch-target">
            <Users className="h-5 w-5 md:h-6 md:w-6" />
            <span className="text-xs md:text-sm text-center whitespace-nowrap">Gerenciar Usuários</span>
          </Button>
          <Button variant="outline" className="h-auto p-3 md:p-4 flex flex-col items-center gap-2 touch-target">
            <Building2 className="h-5 w-5 md:h-6 md:w-6" />
            <span className="text-xs md:text-sm text-center whitespace-nowrap">Cadastrar Empresa</span>
          </Button>
          <Button variant="outline" className="h-auto p-3 md:p-4 flex flex-col items-center gap-2 touch-target">
            <ShoppingBag className="h-5 w-5 md:h-6 md:w-6" />
            <span className="text-xs md:text-sm text-center whitespace-nowrap">Novos Pedidos</span>
          </Button>
          <Button variant="outline" className="h-auto p-3 md:p-4 flex flex-col items-center gap-2 touch-target">
            <MonitorPlay className="h-5 w-5 md:h-6 md:w-6" />
            <span className="text-xs md:text-sm text-center whitespace-nowrap">Monitoramento</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardQuickActions;