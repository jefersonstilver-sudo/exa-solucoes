
import React from 'react';
import { Users, Eye, Building2 } from 'lucide-react';
import { BuildingStore } from '@/services/buildingStoreService';

interface BuildingCardMetricsProps {
  building: BuildingStore;
}

const BuildingCardMetrics: React.FC<BuildingCardMetricsProps> = ({ building }) => {
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
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      <div className="bg-blue-50 p-4 rounded-xl">
        <div className="flex items-center mb-2">
          <Users className="h-5 w-5 text-blue-600 mr-2" />
          <span className="text-sm text-blue-600 font-medium">Público</span>
        </div>
        <p className="text-xl font-bold text-blue-900">
          {formatNumber(building.publico_estimado)}
        </p>
      </div>
      
      <div className="bg-green-50 p-4 rounded-xl">
        <div className="flex items-center mb-2">
          <Eye className="h-5 w-5 text-green-600 mr-2" />
          <span className="text-sm text-green-600 font-medium">Views/mês</span>
        </div>
        <p className="text-xl font-bold text-green-900">
          {formatNumber(building.visualizacoes_mes)}
        </p>
      </div>

      <div className="bg-purple-50 p-4 rounded-xl col-span-2 lg:col-span-1">
        <div className="flex items-center mb-2">
          <Building2 className="h-5 w-5 text-purple-600 mr-2" />
          <span className="text-sm text-purple-600 font-medium">Painéis</span>
        </div>
        <p className="text-xl font-bold text-purple-900">
          {building.quantidade_telas}
        </p>
      </div>
    </div>
  );
};

export default BuildingCardMetrics;
