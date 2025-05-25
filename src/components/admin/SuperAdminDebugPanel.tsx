
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Database, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DatabaseStatus {
  table: string;
  count: number;
  status: 'success' | 'error';
  error?: string;
  lastUpdated: string;
}

const SuperAdminDebugPanel = () => {
  const [debugData, setDebugData] = useState<DatabaseStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [revenue, setRevenue] = useState<number>(0);

  const testAllTables = async () => {
    setLoading(true);
    const results: DatabaseStatus[] = [];
    
    const tables = ['users', 'buildings', 'pedidos', 'painels'];
    
    for (const table of tables) {
      try {
        console.log(`🔍 Testando tabela: ${table}`);
        const { data, error } = await supabase
          .from(table)
          .select('*');
          
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
    
    // Testar função de receita
    try {
      const { data: revenueData, error: revenueError } = await supabase
        .rpc('get_real_revenue');
        
      if (revenueError) {
        console.error('❌ Erro na função get_real_revenue:', revenueError);
        toast.error('Erro ao calcular receita');
      } else {
        console.log('💰 Receita calculada:', revenueData);
        setRevenue(Number(revenueData) || 0);
        toast.success(`Receita atual: R$ ${Number(revenueData || 0).toFixed(2)}`);
      }
    } catch (err) {
      console.error('💥 Erro na função de receita:', err);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    testAllTables();
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
            Debug Panel - Super Admin
          </div>
          <Button 
            onClick={testAllTables} 
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Testar Conexões
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-green-800 flex items-center">
                <Eye className="h-4 w-4 mr-2" />
                Receita Real Confirmada
              </h3>
              <p className="text-green-700 text-sm">
                Valor obtido diretamente do Supabase via função get_real_revenue()
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
      </CardContent>
    </Card>
  );
};

export default SuperAdminDebugPanel;
