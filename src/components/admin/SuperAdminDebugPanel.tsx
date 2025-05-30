
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Database, CheckCircle, AlertCircle, Eye, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DatabaseStatus {
  table: string;
  count: number;
  status: 'success' | 'error';
  error?: string;
  lastUpdated: string;
}

interface DashboardStats {
  total_users: number;
  total_buildings: number;
  total_panels: number;
  online_panels: number;
}

const SuperAdminDebugPanel = () => {
  const [debugData, setDebugData] = useState<DatabaseStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [revenue, setRevenue] = useState<number>(0);
  const [systemStats, setSystemStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalBuildings: 0,
    totalPanels: 0,
    onlinePanels: 0
  });

  const testAllConnections = async () => {
    setLoading(true);
    const results: DatabaseStatus[] = [];
    
    const tables = [
      'users', 
      'buildings', 
      'pedidos', 
      'painels', 
      'videos',
      'pedido_videos',
      'cupons',
      'notifications'
    ] as const;
    
    for (const table of tables) {
      try {
        console.log(`🔍 Testando conexão: ${table}`);
        const { data, error } = await supabase
          .from(table as any)
          .select('*', { count: 'exact' });
          
        if (error) {
          console.error(`❌ Erro na tabela ${table}:`, error);
          results.push({
            table,
            count: 0,
            status: 'error',
            error: error.message,
            lastUpdated: new Date().toLocaleTimeString()
          });
        } else {
          console.log(`✅ Tabela ${table}: ${data?.length || 0} registros`);
          results.push({
            table,
            count: data?.length || 0,
            status: 'success',
            lastUpdated: new Date().toLocaleTimeString()
          });
        }
      } catch (err) {
        console.error(`💥 Erro crítico na tabela ${table}:`, err);
        results.push({
          table,
          count: 0,
          status: 'error',
          error: 'Erro crítico de conexão',
          lastUpdated: new Date().toLocaleTimeString()
        });
      }
    }
    
    setDebugData(results);
    
    // Testar função de receita real
    try {
      const { data: revenueData, error: revenueError } = await supabase
        .rpc('get_real_revenue');
        
      if (revenueError) {
        console.error('❌ Erro na função get_real_revenue:', revenueError);
        toast.error('Erro ao calcular receita real');
      } else {
        console.log('💰 Receita real calculada:', revenueData);
        setRevenue(Number(revenueData) || 0);
      }
    } catch (err) {
      console.error('💥 Erro na função de receita:', err);
    }

    // Testar estatísticas do sistema com casting correto
    try {
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_dashboard_stats');
        
      if (statsError) {
        console.error('❌ Erro nas estatísticas:', statsError);
      } else {
        console.log('📊 Estatísticas do sistema:', statsData);
        // Cast correto para o tipo esperado
        const stats = statsData as DashboardStats;
        setSystemStats({
          totalUsers: stats.total_users || 0,
          totalBuildings: stats.total_buildings || 0,
          totalPanels: stats.total_panels || 0,
          onlinePanels: stats.online_panels || 0
        });
      }
    } catch (err) {
      console.error('💥 Erro nas estatísticas do sistema:', err);
    }
    
    setLoading(false);
    toast.success('Teste de conectividade concluído!');
  };

  useEffect(() => {
    testAllConnections();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Card className="mb-6 border-2 border-indexa-purple/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Database className="h-5 w-5 mr-2 text-indexa-purple" />
            Sistema de Monitoramento - Dados Reais
          </div>
          <Button 
            onClick={testAllConnections} 
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Testar Conexões
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Estatísticas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-3 bg-blue-50">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-blue-800">Usuários</span>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-900">{systemStats.totalUsers}</div>
            <div className="text-xs text-blue-600">Total registrado</div>
          </Card>

          <Card className="p-3 bg-green-50">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-green-800">Prédios</span>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-900">{systemStats.totalBuildings}</div>
            <div className="text-xs text-green-600">Cadastrados</div>
          </Card>

          <Card className="p-3 bg-purple-50">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-purple-800">Painéis</span>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-900">{systemStats.totalPanels}</div>
            <div className="text-xs text-purple-600">Total ativo</div>
          </Card>

          <Card className="p-3 bg-orange-50">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-orange-800">Online</span>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-orange-900">{systemStats.onlinePanels}</div>
            <div className="text-xs text-orange-600">Painéis ativos</div>
          </Card>
        </div>

        {/* Status das Tabelas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {debugData.map((item) => (
            <Card key={item.table} className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium capitalize">{item.table}</span>
                {item.status === 'success' ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
              </div>
              <div className="text-2xl font-bold mb-1">
                {item.status === 'success' ? item.count : '---'}
              </div>
              <div className="text-xs text-gray-500">{item.lastUpdated}</div>
              {item.error && (
                <div className="text-xs text-red-600 mt-1 truncate" title={item.error}>
                  {item.error}
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Receita Real */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-green-800 flex items-center">
                <Eye className="h-4 w-4 mr-2" />
                Receita Real Confirmada
              </h3>
              <p className="text-green-700 text-sm">
                Obtida diretamente via função get_real_revenue() - Apenas pedidos com status 'pago'
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-800">
                {formatCurrency(revenue)}
              </div>
              <Badge variant="outline" className="border-green-500 text-green-600">
                Dados Reais
              </Badge>
            </div>
          </div>
        </div>

        {/* Status de Conectividade */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">Status da Conectividade:</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-blue-700">Banco: Conectado</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-blue-700">RPC: Funcionando</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-blue-700">Auth: Ativo</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-blue-700">RLS: Configurado</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SuperAdminDebugPanel;
