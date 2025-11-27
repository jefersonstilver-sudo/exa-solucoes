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
    <Card className="lg:col-span-2 bg-white/90 backdrop-blur-xl border border-white/40 shadow-[var(--shadow-glass)] hover:shadow-[var(--shadow-xl)] transition-all duration-normal ease-apple rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base md:text-lg text-[hsl(var(--apple-gray-900))]">
          <Zap className="h-4 w-4 md:h-5 md:w-5 text-[hsl(var(--exa-red))]" />
          Ações Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          <Button 
            variant="outline" 
            className="h-auto p-4 md:p-5 flex flex-col items-center gap-3 touch-target bg-gradient-to-br from-white to-[hsl(var(--apple-gray-50))] border-[hsl(var(--apple-gray-200))] hover:border-[hsl(var(--exa-red))] hover:shadow-md transition-all duration-200"
          >
            <Users className="h-6 w-6 md:h-7 md:w-7 text-[hsl(var(--exa-red))]" />
            <span className="text-xs md:text-sm font-medium text-center whitespace-nowrap">Gerenciar Usuários</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-auto p-4 md:p-5 flex flex-col items-center gap-3 touch-target bg-gradient-to-br from-white to-[hsl(var(--apple-gray-50))] border-[hsl(var(--apple-gray-200))] hover:border-[hsl(var(--exa-red))] hover:shadow-md transition-all duration-200"
          >
            <Building2 className="h-6 w-6 md:h-7 md:w-7 text-blue-600" />
            <span className="text-xs md:text-sm font-medium text-center whitespace-nowrap">Cadastrar Empresa</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-auto p-4 md:p-5 flex flex-col items-center gap-3 touch-target bg-gradient-to-br from-white to-[hsl(var(--apple-gray-50))] border-[hsl(var(--apple-gray-200))] hover:border-[hsl(var(--exa-red))] hover:shadow-md transition-all duration-200"
          >
            <ShoppingBag className="h-6 w-6 md:h-7 md:w-7 text-green-600" />
            <span className="text-xs md:text-sm font-medium text-center whitespace-nowrap">Novos Pedidos</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-auto p-4 md:p-5 flex flex-col items-center gap-3 touch-target bg-gradient-to-br from-white to-[hsl(var(--apple-gray-50))] border-[hsl(var(--apple-gray-200))] hover:border-[hsl(var(--exa-red))] hover:shadow-md transition-all duration-200"
          >
            <MonitorPlay className="h-6 w-6 md:h-7 md:w-7 text-emerald-600" />
            <span className="text-xs md:text-sm font-medium text-center whitespace-nowrap">Monitoramento</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardQuickActions;