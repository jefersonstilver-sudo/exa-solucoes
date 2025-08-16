import React from 'react';
import { Users, Eye, Building2 } from 'lucide-react';
import { BuildingStore } from '@/services/buildingStoreService';
interface BuildingCardMetricsProps {
  building: BuildingStore;
}
const BuildingCardMetrics: React.FC<BuildingCardMetricsProps> = ({
  building
}) => {
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}K`;
    }
    return num.toString();
  };
  return <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
      <div className="bg-blue-50 p-3 rounded-lg">
        <div className="flex items-center mb-1">
          <Users className="h-4 w-4 text-blue-600 mr-1" />
          <span className="text-xs text-blue-600 font-medium">Público</span>
        </div>
        <p className="text-lg font-bold text-blue-900">
          {formatNumber(building.publico_estimado)}
        </p>
      </div>
      
      <div className="bg-green-50 p-3 rounded-lg">
        <div className="flex items-center mb-1">
          <Eye className="h-4 w-4 text-green-600 mr-1" />
          <span className="text-xs text-green-600 font-medium">Views/mês</span>
        </div>
        <p className="text-lg font-bold text-green-900">
          {formatNumber(building.visualizacoes_mes)}
        </p>
      </div>

      
    </div>;
};
export default BuildingCardMetrics;