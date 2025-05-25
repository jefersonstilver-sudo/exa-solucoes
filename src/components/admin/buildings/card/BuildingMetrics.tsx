
import React from 'react';
import { Users, Eye, Monitor, Calculator } from 'lucide-react';

interface BuildingMetricsProps {
  building: any;
  panelStats: {
    total: number;
    online: number;
    offline: number;
    maintenance: number;
  };
}

const BuildingMetrics: React.FC<BuildingMetricsProps> = ({ building, panelStats }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
      <div className="text-center">
        <div className="flex items-center justify-center space-x-1 mb-1">
          <Users className="h-4 w-4 text-blue-600" />
          <span className="text-xs text-gray-500">Unidades</span>
        </div>
        <div className="font-bold text-blue-600">{building.numero_unidades}</div>
      </div>

      <div className="text-center">
        <div className="flex items-center justify-center space-x-1 mb-1">
          <Eye className="h-4 w-4 text-purple-600" />
          <span className="text-xs text-gray-500">Público</span>
        </div>
        <div className="font-bold text-purple-600">{building.publico_estimado}</div>
      </div>

      <div className="text-center">
        <div className="flex items-center justify-center space-x-1 mb-1">
          <Monitor className="h-4 w-4 text-indigo-600" />
          <span className="text-xs text-gray-500">Painéis</span>
        </div>
        <div className="font-bold text-indigo-600">{panelStats.total}</div>
      </div>

      <div className="text-center">
        <div className="flex items-center justify-center space-x-1 mb-1">
          <Calculator className="h-4 w-4 text-orange-600" />
          <span className="text-xs text-gray-500">Views/mês</span>
        </div>
        <div className="font-bold text-orange-600 text-sm">
          {building.visualizacoes_mes?.toLocaleString() || '0'}
        </div>
      </div>
    </div>
  );
};

export default BuildingMetrics;
