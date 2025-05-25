
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, PieChart as PieChartIcon, BarChart3, Users, Database } from 'lucide-react';
import { ChartData } from '@/hooks/useSupabaseData';

interface DashboardChartsProps {
  data: ChartData;
}

const DashboardCharts: React.FC<DashboardChartsProps> = ({ data }) => {
  const formatCurrency = (value: number) => `R$ ${value.toFixed(2)}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
      {/* Receita Mensal - Dados Reais */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-indexa-purple" />
            Receita Mensal (Dados Reais)
          </CardTitle>
          <CardDescription className="text-gray-600 flex items-center">
            <Database className="h-4 w-4 mr-1" />
            Conectado ao Supabase - Evolução baseada em pedidos pagos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="month" 
                stroke="#64748b"
                fontSize={12}
              />
              <YAxis 
                stroke="#64748b"
                fontSize={12}
                tickFormatter={formatCurrency}
              />
              <Tooltip 
                formatter={(value: any) => [formatCurrency(value), 'Receita Real']}
                labelStyle={{ color: '#1e293b' }}
                contentStyle={{ 
                  backgroundColor: '#f8fafc', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#7c3aed" 
                strokeWidth={3}
                dot={{ fill: '#7c3aed', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, fill: '#7c3aed' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Status dos Pedidos - Dados Reais */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center">
            <PieChartIcon className="h-5 w-5 mr-2 text-indexa-purple" />
            Status dos Pedidos (Dados Reais)
          </CardTitle>
          <CardDescription className="text-gray-600 flex items-center">
            <Database className="h-4 w-4 mr-1" />
            Dados da tabela 'pedidos' em tempo real
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.orderStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent }) => 
                  value > 0 ? `${name} ${value} (${(percent * 100).toFixed(0)}%)` : null
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.orderStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => [value, 'Pedidos']} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Status dos Painéis - Dados Reais */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-indexa-purple" />
            Status dos Painéis (Dados Reais)
          </CardTitle>
          <CardDescription className="text-gray-600 flex items-center">
            <Database className="h-4 w-4 mr-1" />
            Status operacional da tabela 'painels'
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.panelStatusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="status" 
                stroke="#64748b"
                fontSize={12}
              />
              <YAxis 
                stroke="#64748b"
                fontSize={12}
              />
              <Tooltip 
                formatter={(value: any) => [value, 'Painéis']}
                contentStyle={{ 
                  backgroundColor: '#f8fafc', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
              />
              <Bar 
                dataKey="count" 
                fill="#00D9BB" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Crescimento de Usuários - Dados Reais */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center">
            <Users className="h-5 w-5 mr-2 text-indexa-purple" />
            Crescimento de Usuários (Dados Reais)
          </CardTitle>
          <CardDescription className="text-gray-600 flex items-center">
            <Database className="h-4 w-4 mr-1" />
            Evolução baseada na tabela 'users'
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="month" 
                stroke="#64748b"
                fontSize={12}
              />
              <YAxis 
                stroke="#64748b"
                fontSize={12}
              />
              <Tooltip 
                formatter={(value: any) => [value, 'Usuários']}
                contentStyle={{ 
                  backgroundColor: '#f8fafc', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="users" 
                stroke="#7c3aed" 
                fill="url(#colorUsers)" 
                strokeWidth={2}
              />
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardCharts;
