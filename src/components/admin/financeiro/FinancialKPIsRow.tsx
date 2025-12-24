import React from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, CreditCard, RefreshCcw, AlertTriangle, Percent, Users } from 'lucide-react';
import { formatCurrency } from '@/utils/priceUtils';

interface KPIData {
  revenue_30d: number;
  avg_ticket: number;
  mp_fees: number;
  refunds: number;
  chargebacks: number;
  net_margin: number;
  payments_count: number;
}

interface FinancialKPIsRowProps {
  data: KPIData | null;
  loading: boolean;
}

const FinancialKPIsRow: React.FC<FinancialKPIsRowProps> = ({ data, loading }) => {
  const kpis = [
    {
      label: 'Receita 30d',
      value: data?.revenue_30d || 0,
      format: 'currency',
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      label: 'Ticket Médio',
      value: data?.avg_ticket || 0,
      format: 'currency',
      icon: CreditCard,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Taxas MP',
      value: data?.mp_fees || 0,
      format: 'currency',
      icon: Percent,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      label: 'Reembolsos',
      value: data?.refunds || 0,
      format: 'currency',
      icon: RefreshCcw,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50'
    },
    {
      label: 'Chargebacks',
      value: data?.chargebacks || 0,
      format: 'number',
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      label: 'Pagamentos',
      value: data?.payments_count || 0,
      format: 'number',
      icon: Users,
      color: 'text-violet-600',
      bgColor: 'bg-violet-50'
    }
  ];

  const formatValue = (value: number, format: string) => {
    if (loading) return '...';
    if (format === 'currency') return formatCurrency(value);
    if (format === 'percent') return `${value.toFixed(1)}%`;
    return value.toString();
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {kpis.map((kpi) => (
        <Card
          key={kpi.label}
          className="p-4 border border-border hover:shadow-sm transition-shadow"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground truncate">{kpi.label}</p>
              <p className={`text-sm font-semibold ${kpi.color}`}>
                {formatValue(kpi.value, kpi.format)}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default FinancialKPIsRow;
