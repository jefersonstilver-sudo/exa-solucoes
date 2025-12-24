import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface PaymentMethodData {
  name: string;
  value: number;
}

interface PaymentMethodsChartProps {
  data?: PaymentMethodData[];
  loading?: boolean;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(220, 60%, 50%)',
  'hsl(280, 50%, 50%)',
  'hsl(var(--muted-foreground))'
];

const PaymentMethodsChart: React.FC<PaymentMethodsChartProps> = ({ data = [], loading }) => {
  const hasData = data && data.length > 0 && data.some(d => d.value > 0);
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  return (
    <Card className="bg-card border border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
          <CreditCard className="h-4 w-4 text-primary" />
          Métodos de Pagamento
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[250px] flex items-center justify-center">
            <span className="text-muted-foreground">Carregando...</span>
          </div>
        ) : !hasData ? (
          <div className="h-[250px] flex items-center justify-center">
            <span className="text-muted-foreground text-sm">Sem dados de pagamentos</span>
          </div>
        ) : (
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value) => {
                    const item = data.find(d => d.name === value);
                    const percent = item && total > 0 ? ((item.value / total) * 100).toFixed(0) : 0;
                    return <span className="text-xs text-foreground">{value} ({percent}%)</span>;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentMethodsChart;
