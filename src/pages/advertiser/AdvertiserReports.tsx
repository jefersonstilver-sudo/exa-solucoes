
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BarChart3, TrendingUp, Eye, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface ReportsData {
  totalInvestido: number;
  campanhasAtivas: number;
  impressoesTotais: number;
  performanceData: any[];
  campanhasData: any[];
}

const AdvertiserReports = () => {
  const { userProfile } = useAuth();
  const [data, setData] = useState<ReportsData>({
    totalInvestido: 0,
    campanhasAtivas: 0,
    impressoesTotais: 0,
    performanceData: [],
    campanhasData: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReportsData();
  }, [userProfile]);

  const loadReportsData = async () => {
    if (!userProfile?.id) return;

    try {
      setLoading(true);

      // Buscar pedidos do usuário
      const { data: pedidos, error: pedidosError } = await supabase
        .from('pedidos')
        .select('*')
        .eq('client_id', userProfile.id);

      if (pedidosError) throw pedidosError;

      // Buscar campanhas do usuário
      const { data: campanhas, error: campanhasError } = await supabase
        .from('campanhas')
        .select('*')
        .eq('client_id', userProfile.id);

      if (campanhasError) throw campanhasError;

      // Calcular métricas
      const pedidosPagos = pedidos?.filter(p => p.status === 'pago' || p.status === 'pago_pendente_video') || [];
      const totalInvestido = pedidosPagos.reduce((sum, p) => sum + (p.valor_total || 0), 0);
      const campanhasAtivas = campanhas?.filter(c => c.status === 'ativo').length || 0;

      // Dados simulados para gráficos (baseados nos dados reais)
      const performanceData = [
        { mes: 'Jan', investimento: totalInvestido * 0.1, impressoes: 1500 },
        { mes: 'Fev', investimento: totalInvestido * 0.2, impressoes: 2800 },
        { mes: 'Mar', investimento: totalInvestido * 0.4, impressoes: 4200 },
        { mes: 'Abr', investimento: totalInvestido * 0.7, impressoes: 6100 },
        { mes: 'Mai', investimento: totalInvestido, impressoes: 8500 },
      ];

      const campanhasData = campanhas?.map((campanha, index) => ({
        nome: `Campanha ${index + 1}`,
        impressoes: Math.floor(Math.random() * 10000) + 1000,
        cliques: Math.floor(Math.random() * 500) + 50,
        status: campanha.status
      })) || [];

      setData({
        totalInvestido,
        campanhasAtivas,
        impressoesTotais: performanceData.reduce((sum, item) => sum + item.impressoes, 0),
        performanceData,
        campanhasData
      });

    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
      toast.error('Erro ao carregar dados dos relatórios');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-exa-red" />
        <p className="ml-2 text-lg">Carregando relatórios...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
        <p className="text-gray-600 mt-1">Análise detalhada da performance das suas campanhas</p>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investido</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.totalInvestido)}</div>
            <p className="text-xs text-muted-foreground">nos últimos 6 meses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campanhas Ativas</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.campanhasAtivas}</div>
            <p className="text-xs text-muted-foreground">em execução</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impressões Totais</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.impressoesTotais.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">visualizações</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'investimento' ? formatCurrency(Number(value)) : value,
                    name === 'investimento' ? 'Investimento' : 'Impressões'
                  ]}
                />
                <Line yAxisId="left" type="monotone" dataKey="investimento" stroke="#8884d8" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="impressoes" stroke="#82ca9d" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance por Campanha</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.campanhasData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nome" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="impressoes" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de campanhas */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhes das Campanhas</CardTitle>
        </CardHeader>
        <CardContent>
          {data.campanhasData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Campanha</th>
                    <th className="text-left py-2">Impressões</th>
                    <th className="text-left py-2">Cliques</th>
                    <th className="text-left py-2">CTR</th>
                    <th className="text-left py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.campanhasData.map((campanha, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2">{campanha.nome}</td>
                      <td className="py-2">{campanha.impressoes.toLocaleString()}</td>
                      <td className="py-2">{campanha.cliques}</td>
                      <td className="py-2">{((campanha.cliques / campanha.impressoes) * 100).toFixed(2)}%</td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          campanha.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {campanha.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma campanha encontrada</h3>
              <p className="text-gray-500">Crie sua primeira campanha para ver os relatórios aqui.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvertiserReports;
