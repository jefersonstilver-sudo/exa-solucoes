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
    return num.toLocaleString('pt-BR');
  };

  return (
    <div className="flex items-center gap-4 text-sm text-gray-600">
      {/* Exibições */}
      <div className="flex items-center gap-1">
        <Eye className="h-4 w-4" />
        <span className="font-medium">{formatNumber(building.visualizacoes_mes || 0)}</span>
      </div>
      
      {/* Alcance */}
      <div className="flex items-center gap-1">
        <Users className="h-4 w-4" />
        <span className="font-medium">{formatNumber(building.publico_estimado || 0)}</span>
      </div>
      
      {/* Telas */}
      <div className="flex items-center gap-1">
        <Building2 className="h-4 w-4" />
        <span className="font-medium">{building.numero_elevadores || 0} telas</span>
      </div>
    </div>
  );
};
export default BuildingCardMetrics;