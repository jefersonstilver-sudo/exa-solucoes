
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Building2,
  MonitorPlay,
  Users,
  Database
} from 'lucide-react';
import { BuildingStats } from '@/services/buildingsStatsService';

interface BuildingsMainStatsProps {
  stats: BuildingStats;
}

const BuildingsMainStats: React.FC<BuildingsMainStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="border-indexa-purple/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">Total de Prédios</CardTitle>
          <Building2 className="h-4 w-4 text-indexa-purple" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <p className="text-xs text-gray-600">
            <Database className="h-3 w-3 inline mr-1" />
            RLS Funcionando
          </p>
        </CardContent>
      </Card>

      <Card className="border-indexa-purple/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">Prédios Ativos</CardTitle>
          <MonitorPlay className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{stats.active}</div>
          <p className="text-xs text-blue-600">Operacionais</p>
        </CardContent>
      </Card>

      <Card className="border-indexa-purple/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">Total de Painéis</CardTitle>
          <Users className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{stats.totalPanels}</div>
          <p className="text-xs text-purple-600">telas ativas</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default BuildingsMainStats;
