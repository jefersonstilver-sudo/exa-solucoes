import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';
import GrowthIndicator from './GrowthIndicator';
import { MonthlyDashboardStats } from '@/hooks/useMonthlyDashboardData';
import { ElegantPeriodType } from './ElegantPeriodButton';

interface DashboardFinancialSummaryProps {
  stats: MonthlyDashboardStats;
  periodFilter: ElegantPeriodType;
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
    <Card className="bg-white rounded-2xl border shadow-sm">
      <CardContent className="pt-4 md:pt-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex-1 space-y-1">
            <p className="text-[10px] md:text-xs text-gray-600 font-medium">Receita do Período</p>
            <div className="flex items-baseline gap-2">
              <p className="text-lg md:text-xl font-bold text-[hsl(var(--exa-red))]">
                {formatCurrency(stats.monthly_revenue)}
              </p>
              {growthData && (
                <GrowthIndicator
                  value={growthData.revenue}
                  label=""
                  className="text-xs"
                />
              )}
            </div>
          </div>
          
          <div className="flex-1 space-y-1">
            <p className="text-[10px] md:text-xs text-gray-600 font-medium">Ticket Médio</p>
            <p className="text-lg md:text-xl font-bold text-gray-900">
              {formatCurrency(
                stats.total_orders > 0 
                  ? stats.monthly_revenue / stats.total_orders 
                  : 0
              )}
            </p>
          </div>

          <div className="flex-1 space-y-1">
            <p className="text-[10px] md:text-xs text-gray-600 font-medium">Proj. Anual</p>
            <p className="text-lg md:text-xl font-bold text-gray-900">
              {formatCurrency(stats.monthly_revenue * 12)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardFinancialSummary;