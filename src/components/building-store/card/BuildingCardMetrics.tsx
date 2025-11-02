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

  return (
    <div className="grid grid-cols-3 gap-2 mb-4">
      <div className="bg-gray-50 border border-gray-200 p-3 rounded-md">
        <div className="flex items-center mb-1">
          <Users className="h-3.5 w-3.5 text-gray-500 mr-1" />
          <span className="text-xs text-gray-600 font-medium">Público</span>
        </div>
        <p className="text-base font-bold text-gray-900">
          {formatNumber(building.publico_estimado || 0)}
        </p>
      </div>
      
      <div className="bg-gray-50 border border-gray-200 p-3 rounded-md">
        <div className="flex items-center mb-1">
          <Eye className="h-3.5 w-3.5 text-gray-500 mr-1" />
          <span className="text-xs text-gray-600 font-medium">Exibições</span>
        </div>
        <p className="text-base font-bold text-gray-900">
          {formatNumber(building.visualizacoes_mes || 0)}
        </p>
      </div>

      <div className="bg-gray-50 border border-gray-200 p-3 rounded-md">
        <div className="flex items-center mb-1">
          <Building2 className="h-3.5 w-3.5 text-gray-500 mr-1" />
          <span className="text-xs text-gray-600 font-medium">Telas</span>
        </div>
        <p className="text-base font-bold text-gray-900">
          {building.numero_elevadores || 0}
        </p>
      </div>
    </div>
  );
};
export default BuildingCardMetrics;