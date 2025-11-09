import React, { useState, useMemo } from 'react';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileBarChart, TrendingUp, DollarSign, Users, Gift, Loader2, Calendar, Download } from 'lucide-react';
import { useFinancialReports } from '@/hooks/useFinancialReports';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

const FinancialReports = () => {
  const { canViewFinancialReports, isLoadingCustom } = useUserPermissions();
  const [periodFilter, setPeriodFilter] = useState<'7' | '30' | '90' | 'all'>('30');
  
  const { start, end } = useMemo(() => {
    if (periodFilter === 'all') {
      return { start: undefined, end: undefined };
    }
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - parseInt(periodFilter));
    return { start, end };
  }, [periodFilter]);

  const { metrics, revenueByMonth, topClients, loading, refetch } = useFinancialReports(start, end);
  
  // 🔒 CRITICAL: Wait for permissions to load before checking
  if (isLoadingCustom) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (!canViewFinancialReports) {
    return <Navigate to="/admin" replace />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-3 md:p-6 space-y-6">
      {/* Header com Filtros */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            📊 Relatórios Financeiros
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Análise completa de vendas, pedidos e benefícios
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Select 
            value={periodFilter} 
            onValueChange={(v: any) => {
              setPeriodFilter(v);
              toast.success(v === 'all' ? '📊 Mostrando todos os dados' : `Período alterado para ${v} dias`);
            }}
          >
            <SelectTrigger className="w-[200px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="all" className="font-bold text-primary">📊 Tudo (Desde o Início)</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={refetch}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Dashboard de Métricas */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Mês atual: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.monthlyRevenue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Ativos</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics.activeOrders}</div>
            <p className="text-xs text-muted-foreground">Contratos ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Benefícios Pendentes</CardTitle>
            <Gift className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{metrics.pendingBenefits}</div>
            <p className="text-xs text-muted-foreground">Aguardando código</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{metrics.activeClients}</div>
            <p className="text-xs text-muted-foreground">Com pedidos ativos</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Receita */}
      <Card>
        <CardHeader>
          <CardTitle>Receita por Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)} />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Clientes */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topClients.map((client, index) => (
              <div key={client.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{client.name}</p>
                    <p className="text-sm text-muted-foreground">{client.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(client.totalSpent)}
                  </p>
                  <p className="text-xs text-muted-foreground">{client.ordersCount} pedidos</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialReports;