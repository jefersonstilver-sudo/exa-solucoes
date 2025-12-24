import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface CashFlowData {
  date: string;
  entradas: number;
  saidas: number;
}

interface CashFlowChartProps {
  data?: CashFlowData[];
  loading?: boolean;
}

const CashFlowChart: React.FC<CashFlowChartProps> = ({ data, loading }) => {
  // Mock data for demonstration
  const mockData: CashFlowData[] = [
    { date: '01/12', entradas: 12500, saidas: 2100 },
    { date: '05/12', entradas: 8900, saidas: 1800 },
    { date: '10/12', entradas: 15200, saidas: 3200 },
    { date: '15/12', entradas: 9800, saidas: 2500 },
    { date: '20/12', entradas: 18500, saidas: 4100 },
    { date: '24/12', entradas: 11200, saidas: 2800 },
  ];

  const chartData = data || mockData;

  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString('pt-BR')}`;
  };

  return (
    <Card className="border-2 border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-primary" />
          Fluxo de Caixa (30 dias)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Carregando...</div>
          </div>
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis 
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="entradas" 
                  name="Entradas"
                  stroke="hsl(142, 76%, 36%)" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(142, 76%, 36%)', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="saidas" 
                  name="Saídas"
                  stroke="hsl(0, 84%, 60%)" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(0, 84%, 60%)', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CashFlowChart;
