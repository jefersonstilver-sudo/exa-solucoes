import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';
import GrowthIndicator from './GrowthIndicator';
import { MonthlyDashboardStats } from '@/hooks/useMonthlyDashboardData';
import { PeriodType } from '@/components/admin/common/AdminPeriodSelector';

interface DashboardFinancialSummaryProps {
  stats: MonthlyDashboardStats;
  periodFilter: PeriodType;
  growthData: {
    revenue: number;
  } | null;
}

const DashboardFinancialSummary = ({
  stats,
  periodFilter,
  growthData
}: DashboardFinancialSummaryProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  return (
    <Card className="bg-gradient-to-r from-[#9C1E1E] via-[#180A0A] to-[#9C1E1E] text-white shadow-2xl border-0 rounded-2xl overflow-hidden relative">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"></div>
      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-3 text-xl md:text-2xl">
          <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
            <DollarSign className="h-6 w-6 md:h-7 md:w-7" />
          </div>
          Resumo Financeiro
        </CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <p className="text-sm text-white/70">Receita do Período</p>
            <p className="text-3xl md:text-4xl font-bold">{formatCurrency(stats.monthly_revenue)}</p>
            {growthData && (
              <GrowthIndicator value={growthData.revenue} label="vs período anterior" className="text-white/80" />
            )}
          </div>
          <div className="space-y-2">
            <p className="text-sm text-white/70">Total Acumulado</p>
            <p className="text-2xl md:text-3xl font-semibold">{formatCurrency(stats.monthly_revenue * 12)}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-white/70">Ticket Médio</p>
            <p className="text-2xl md:text-3xl font-semibold">
              {stats.total_orders > 0 
                ? formatCurrency(stats.monthly_revenue / stats.total_orders)
                : formatCurrency(0)
              }
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardFinancialSummary;