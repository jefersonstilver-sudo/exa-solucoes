
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';
import GrowthIndicator from './GrowthIndicator';
import { MonthlyDashboardStats } from '@/hooks/useMonthlyDashboardData';

interface DashboardFinancialSummaryProps {
  stats: MonthlyDashboardStats;
  selectedMonth: string;
  growthData: {
    revenue: number;
  } | null;
}

const DashboardFinancialSummary = ({ stats, selectedMonth, growthData }: DashboardFinancialSummaryProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Card className="bg-gradient-to-r from-indexa-purple via-indexa-purple-dark to-indexa-purple text-white shadow-2xl border-0">
      <CardHeader>
        <CardTitle className="flex items-center text-white">
          <DollarSign className="h-6 w-6 mr-3" />
          Resumo Financeiro - {selectedMonth}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-white">
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">{formatCurrency(stats.monthly_revenue)}</div>
            <p className="text-sm opacity-80">Receita do Mês</p>
            {growthData && (
              <div className="mt-2">
                <GrowthIndicator 
                  value={growthData.revenue} 
                  label="vs anterior"
                  className="justify-center text-white opacity-80"
                />
              </div>
            )}
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">{stats.active_orders}</div>
            <p className="text-sm opacity-80">Pedidos Ativos</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">{stats.pending_orders}</div>
            <p className="text-sm opacity-80">Pedidos Pendentes</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardFinancialSummary;
