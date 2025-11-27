import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, PieChart as PieChartIcon, Users, AlertCircle } from 'lucide-react';
import { ChartData } from '@/hooks/useSupabaseData';

interface DashboardChartsProps {
  data: ChartData;
}

const DashboardCharts: React.FC<DashboardChartsProps> = ({ data }) => {
  const formatCurrency = (value: number) => `R$ ${value.toFixed(2)}`;

  const EmptyState = ({ title, description }: { title: string; description: string }) => (
    <div className="flex flex-col items-center justify-center h-[180px] text-center p-4">
      <AlertCircle className="h-8 w-8 text-gray-400 mb-2" />
      <h3 className="text-sm font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Receita Mensal */}
      <Card className="bg-gradient-to-br from-background via-background to-accent/5 rounded-2xl border border-border/40 shadow-lg hover:shadow-xl hover:border-primary/20 transition-all">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm md:text-base text-gray-900 flex items-center">
            <TrendingUp className="h-4 w-4 mr-2 text-[hsl(var(--exa-red))]" />
            Receita Total
          </CardTitle>
          <CardDescription className="text-[10px] md:text-xs text-gray-600">
            Últimos 12 meses
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={data.revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  stroke="#64748b"
                  fontSize={10}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  stroke="#64748b"
                  fontSize={10}
                  tickFormatter={formatCurrency}
                />
                <Tooltip 
                  formatter={(value: any) => [formatCurrency(value), 'Receita']}
                  contentStyle={{ 
                    backgroundColor: '#f8fafc', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#9C1E1E" 
                  strokeWidth={2}
                  dot={{ fill: '#9C1E1E', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, fill: '#9C1E1E' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState 
              title="Sem receita registrada" 
              description="Aguardando primeiros pagamentos" 
            />
          )}
        </CardContent>
      </Card>

      {/* Status dos Pedidos */}
      <Card className="bg-gradient-to-br from-background via-background to-accent/5 rounded-2xl border border-border/40 shadow-lg hover:shadow-xl hover:border-primary/20 transition-all">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm md:text-base text-gray-900 flex items-center">
            <PieChartIcon className="h-4 w-4 mr-2 text-[hsl(var(--exa-red))]" />
            Status dos Pedidos
          </CardTitle>
          <CardDescription className="text-[10px] md:text-xs text-gray-600">
            Distribuição atual
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.orderStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={data.orderStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => 
                    `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                  }
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.orderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [value, 'Pedidos']}
                  contentStyle={{ fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState 
              title="Sem pedidos" 
              description="Aguardando primeiros pedidos" 
            />
          )}
        </CardContent>
      </Card>

      {/* Crescimento de Usuários */}
      <Card className="bg-gradient-to-br from-background via-background to-accent/5 rounded-2xl border border-border/40 shadow-lg hover:shadow-xl hover:border-primary/20 transition-all lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm md:text-base text-gray-900 flex items-center">
            <Users className="h-4 w-4 mr-2 text-[hsl(var(--exa-red))]" />
            Crescimento de Usuários
          </CardTitle>
          <CardDescription className="text-[10px] md:text-xs text-gray-600">
            Evolução nos últimos meses
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.userGrowthData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={data.userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  stroke="#64748b"
                  fontSize={10}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  stroke="#64748b"
                  fontSize={10}
                />
                <Tooltip 
                  formatter={(value: any) => [value, 'Usuários']}
                  contentStyle={{ 
                    backgroundColor: '#f8fafc', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#9C1E1E" 
                  fill="url(#colorUsers)" 
                  strokeWidth={2}
                />
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9C1E1E" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#9C1E1E" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState 
              title="Sem usuários" 
              description="Aguardando primeiros cadastros" 
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardCharts;
