import React from 'react';
import { Card } from '@/components/ui/card';
import { DollarSign, CreditCard, Percent, RefreshCcw, AlertTriangle, Users } from 'lucide-react';
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
      format: 'currency' as const,
      icon: DollarSign
    },
    {
      label: 'Ticket Médio',
      value: data?.avg_ticket || 0,
      format: 'currency' as const,
      icon: CreditCard
    },
    {
      label: 'Taxas MP',
      value: data?.mp_fees || 0,
      format: 'currency' as const,
      icon: Percent
    },
    {
      label: 'Reembolsos',
      value: data?.refunds || 0,
      format: 'currency' as const,
      icon: RefreshCcw
    },
    {
      label: 'Chargebacks',
      value: data?.chargebacks || 0,
      format: 'number' as const,
      icon: AlertTriangle
    },
    {
      label: 'Pagamentos',
      value: data?.payments_count || 0,
      format: 'number' as const,
      icon: Users
    }
  ];

  const formatValue = (value: number, format: 'currency' | 'number' | 'percent') => {
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
          className="p-4 bg-card border border-border"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground truncate">{kpi.label}</p>
              <p className="text-sm font-semibold text-foreground">
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
