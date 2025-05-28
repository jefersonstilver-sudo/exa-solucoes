
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Database, Trash2, RotateCcw } from 'lucide-react';
import { useDataMigration } from '@/hooks/useDataMigration';

const DataMigrationPanel: React.FC = () => {
  const { isMigrating, migrateMissingOrders, cleanupOrphanedData, syncVideoStatus } = useDataMigration();

  const runFullMigration = async () => {
    try {
      await migrateMissingOrders();
      await syncVideoStatus();
      await cleanupOrphanedData();
    } catch (error) {
      console.error('Erro na migração completa:', error);
    }
  };

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center text-black">
          <Database className="h-5 w-5 mr-2 text-[#00FFAB]" />
          Migração e Sincronização de Dados
          <Badge className="ml-2 bg-red-100 text-red-800 border-red-300">Sistema Crítico</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <Button
            onClick={runFullMigration}
            disabled={isMigrating}
            className="bg-[#00FFAB] hover:bg-[#00FFAB]/80 text-white font-semibold"
          >
            {isMigrating ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Database className="h-4 w-4 mr-2" />
            )}
            Migração Completa
          </Button>

          <Button
            onClick={migrateMissingOrders}
            disabled={isMigrating}
            variant="outline"
            className="border-[#00FFAB] text-[#00FFAB] hover:bg-[#00FFAB] hover:text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Migrar Pedidos
          </Button>

          <Button
            onClick={syncVideoStatus}
            disabled={isMigrating}
            variant="outline"
            className="border-[#00FFAB] text-[#00FFAB] hover:bg-[#00FFAB] hover:text-white"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Sync Status
          </Button>

          <Button
            onClick={cleanupOrphanedData}
            disabled={isMigrating}
            variant="outline"
            className="border-gray-400 text-gray-600 hover:bg-gray-100 hover:text-black"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Limpar Dados
          </Button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-black mb-2">Sobre esta ferramenta:</h4>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• <strong>Migração Completa:</strong> Executa todas as operações de uma vez</li>
            <li>• <strong>Migrar Pedidos:</strong> Recupera pedidos perdidos das tentativas de compra</li>
            <li>• <strong>Sync Status:</strong> Sincroniza status entre pedidos e aprovações de vídeo</li>
            <li>• <strong>Limpar Dados:</strong> Remove registros órfãos e duplicados</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataMigrationPanel;
