
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, PieChart as PieChartIcon, BarChart3, Users, Database, AlertCircle } from 'lucide-react';
import { ChartData } from '@/hooks/useSupabaseData';

interface DashboardChartsProps {
  data: ChartData;
}

const DashboardCharts: React.FC<DashboardChartsProps> = ({ data }) => {
  const formatCurrency = (value: number) => `R$ ${value.toFixed(2)}`;

  const EmptyState = ({ title, description }: { title: string; description: string }) => (
    <div className="flex flex-col items-center justify-center h-[300px] text-center p-6">
      <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
      {/* Receita Mensal - Dados Reais */}
      <Card className="bg-white border border-purple-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-indexa-purple" />
            Receita Total (Dados Reais)
          </CardTitle>
          <CardDescription className="text-gray-600 flex items-center">
            <Database className="h-4 w-4 mr-1" />
            Baseado em pedidos pagos no Supabase
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.revenueData.length > 0 ? (
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
                  formatter={(value: any) => [formatCurrency(value), 'Receita']}
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
                  stroke="#4A0968" 
                  strokeWidth={3}
                  dot={{ fill: '#4A0968', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, fill: '#4A0968' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState 
              title="Nenhuma receita registrada" 
              description="Ainda não há pedidos pagos no sistema. A receita aparecerá aqui quando os primeiros pagamentos forem processados." 
            />
          )}
        </CardContent>
      </Card>

      {/* Status dos Pedidos - Dados Reais */}
      <Card className="bg-white border border-purple-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center">
            <PieChartIcon className="h-5 w-5 mr-2 text-indexa-purple" />
            Status dos Pedidos (Dados Reais)
          </CardTitle>
          <CardDescription className="text-gray-600 flex items-center">
            <Database className="h-4 w-4 mr-1" />
            Status atual dos pedidos no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.orderStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.orderStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => 
                    `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
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
          ) : (
            <EmptyState 
              title="Nenhum pedido encontrado" 
              description="Ainda não há pedidos no sistema. Os dados aparecerão aqui quando os primeiros pedidos forem criados." 
            />
          )}
        </CardContent>
      </Card>

      {/* Status dos Painéis - Dados Reais */}
      <Card className="bg-white border border-purple-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-indexa-purple" />
            Status dos Painéis (Dados Reais)
          </CardTitle>
          <CardDescription className="text-gray-600 flex items-center">
            <Database className="h-4 w-4 mr-1" />
            Status operacional dos painéis cadastrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.panelStatusData.length > 0 ? (
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
                  fill="#4A0968" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState 
              title="Nenhum painel encontrado" 
              description="Ainda não há painéis cadastrados no sistema. Os dados de status aparecerão aqui quando os painéis forem registrados." 
            />
          )}
        </CardContent>
      </Card>

      {/* Crescimento de Usuários - Dados Reais */}
      <Card className="bg-white border border-purple-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center">
            <Users className="h-5 w-5 mr-2 text-indexa-purple" />
            Total de Usuários (Dados Reais)
          </CardTitle>
          <CardDescription className="text-gray-600 flex items-center">
            <Database className="h-4 w-4 mr-1" />
            Usuários registrados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.userGrowthData.length > 0 ? (
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
                  stroke="#4A0968" 
                  fill="url(#colorUsers)" 
                  strokeWidth={2}
                />
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4A0968" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4A0968" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState 
              title="Nenhum usuário encontrado" 
              description="Ainda não há usuários registrados no sistema. Os dados aparecerão aqui quando os primeiros usuários se cadastrarem." 
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardCharts;
