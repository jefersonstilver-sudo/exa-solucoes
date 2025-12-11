import React from 'react';
import { Building2 } from 'lucide-react';
import BuildingCard3 from './BuildingCard3';
import { useBuildingsVideoCount } from '@/hooks/useBuildingsVideoCount';

interface BuildingsList3Props {
  buildings: any[];
  onView: (building: any) => void;
  onEdit: (building: any) => void;
  onImageManager: (building: any) => void;
  onDelete: (building: any) => void;
  onViewCampaigns?: (building: any) => void;
}

const BuildingsList3: React.FC<BuildingsList3Props> = ({
  buildings,
  onView,
  onEdit,
  onImageManager,
  onDelete,
  onViewCampaigns
}) => {
  const buildingIds = buildings.map(b => b.id);
  const { counts: videoCounts } = useBuildingsVideoCount(buildingIds);

  if (buildings.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 p-12 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-gray-100 rounded-2xl mb-4">
          <Building2 className="h-7 w-7 text-gray-400" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">Nenhum prédio encontrado</h3>
        <p className="text-sm text-gray-500">Ajuste os filtros ou cadastre um novo prédio.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {buildings.map((building) => (
        <BuildingCard3
          key={building.id}
          building={building}
          onView={onView}
          onEdit={onEdit}
          onImageManager={onImageManager}
          onDelete={onDelete}
          onViewCampaigns={onViewCampaigns}
          videoCount={videoCounts[building.id] ?? 0}
        />
      ))}
    </div>
  );
};

export default BuildingsList3;
