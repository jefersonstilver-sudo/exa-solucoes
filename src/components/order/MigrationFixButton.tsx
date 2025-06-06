
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Database, CheckCircle, RefreshCw } from 'lucide-react';
import { useBuildingDataMigration } from '@/hooks/useBuildingDataMigration';

interface MigrationFixButtonProps {
  orderId?: string;
  showFullMigration?: boolean;
}

export const MigrationFixButton: React.FC<MigrationFixButtonProps> = ({ 
  orderId, 
  showFullMigration = false 
}) => {
  const { 
    migratePedidosWithMissingListaPredios, 
    fixSpecificOrder, 
    isLoading, 
    progress 
  } = useBuildingDataMigration();
  
  const [result, setResult] = useState<any>(null);

  const handleFixSpecificOrder = async () => {
    if (!orderId) return;
    
    const migrationResult = await fixSpecificOrder(orderId);
    setResult(migrationResult);
    
    // Recarregar a página após 2 segundos se bem sucedido
    if (migrationResult.success) {
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  };

  const handleFullMigration = async () => {
    const migrationResult = await migratePedidosWithMissingListaPredios();
    setResult(migrationResult);
  };

  const progressPercentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center text-orange-800">
          <Database className="h-5 w-5 mr-2" />
          Correção de Dados
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
          <div className="text-sm text-orange-700">
            {orderId ? 
              'Este pedido pode ter dados de localização incompletos. Clique para tentar corrigi-los.' :
              'Alguns pedidos podem ter dados de localização incompletos. Execute a migração para corrigi-los.'
            }
          </div>
        </div>

        {isLoading && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm">
                {orderId ? 'Corrigindo pedido...' : `Migrando pedidos... ${progress.current}/${progress.total}`}
              </span>
            </div>
            {progress.total > 0 && (
              <Progress value={progressPercentage} className="w-full" />
            )}
          </div>
        )}

        {result && (
          <div className={`p-3 rounded-lg ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <div className="flex items-center space-x-2">
              {result.success ? 
                <CheckCircle className="h-4 w-4" /> : 
                <AlertTriangle className="h-4 w-4" />
              }
              <span className="text-sm font-medium">
                {result.success ? 
                  (orderId ? 'Pedido corrigido com sucesso! Recarregando...' : `${result.migrated} pedidos migrados com sucesso`) :
                  `Erro: ${result.error}`
                }
              </span>
            </div>
          </div>
        )}

        <div className="flex space-x-2">
          {orderId && (
            <Button 
              onClick={handleFixSpecificOrder}
              disabled={isLoading}
              size="sm"
              variant="outline"
              className="border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              {isLoading ? 'Corrigindo...' : 'Corrigir Este Pedido'}
            </Button>
          )}
          
          {showFullMigration && (
            <Button 
              onClick={handleFullMigration}
              disabled={isLoading}
              size="sm"
              className="bg-orange-600 text-white hover:bg-orange-700"
            >
              {isLoading ? 'Migrando...' : 'Migrar Todos os Pedidos'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
