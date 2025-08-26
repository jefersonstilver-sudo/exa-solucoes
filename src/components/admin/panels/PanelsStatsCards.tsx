
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  MonitorPlay,
  Wifi,
  WifiOff,
  Settings
} from 'lucide-react';
import DataIntegrityBadge from '../DataIntegrityBadge';

interface PanelsStatsCardsProps {
  stats: {
    total: number;
    online: number;
    offline: number;
    maintenance: number;
  };
}


const PanelsStatsCards: React.FC<PanelsStatsCardsProps> = ({ stats }) => {
  const hasRealData = stats.total > 0;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Estatísticas dos Painéis</h2>
        <DataIntegrityBadge 
          isRealData={hasRealData}
          dataSource="Supabase - Tabela painels"
          recordCount={stats.total}
        />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <Card className="border-indexa-purple/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-medium text-gray-700">Total de Painéis</CardTitle>
          <MonitorPlay className="h-6 w-6 text-indexa-purple" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
          <div className="flex items-center space-x-4 mt-2">
            <div className="flex items-center">
              <Wifi className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-sm text-green-600">{stats.online} Online</span>
            </div>
            <div className="flex items-center">
              <WifiOff className="h-4 w-4 text-red-600 mr-1" />
              <span className="text-sm text-red-600">{stats.offline} Offline</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-indexa-purple/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-medium text-gray-700">Status Geral</CardTitle>
          <Settings className="h-6 w-6 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Operacional:</span>
              <span className="text-sm font-medium text-green-600">
                {stats.total > 0 ? Math.round((stats.online / stats.total) * 100) : 0}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Manutenção:</span>
              <span className="text-sm font-medium text-orange-500">{stats.maintenance}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Offline:</span>
              <span className="text-sm font-medium text-red-600">{stats.offline}</span>
            </div>
          </div>
        </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PanelsStatsCards;
