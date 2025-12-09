import React from 'react';
import { BuildingMobileCard } from './BuildingMobileCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2 } from 'lucide-react';
import { useBuildingsVideoCount } from '@/hooks/useBuildingsVideoCount';
import { useBuildingsPanelsStatus } from '@/hooks/useBuildingPanelsStatus';

interface BuildingMobileListProps {
  buildings: any[];
  loading?: boolean;
  onView: (building: any) => void;
  onEdit: (building: any) => void;
  onImageManager: (building: any) => void;
  onViewPlaylist: (building: any) => void;
  onDelete?: (building: any) => void;
}

export const BuildingMobileList: React.FC<BuildingMobileListProps> = ({
  buildings,
  loading = false,
  onView,
  onEdit,
  onImageManager,
  onViewPlaylist,
  onDelete,
}) => {
  const buildingIds = buildings.map(b => b.id);
  const { counts: videoCounts } = useBuildingsVideoCount(buildingIds);
  
  // Get panels status for all buildings
  const { data: panelsStatusMap, isLoading: panelsStatusLoading } = useBuildingsPanelsStatus(buildingIds);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (buildings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Building2 className="h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-lg font-medium text-foreground">Nenhum prédio encontrado</p>
        <p className="text-sm text-muted-foreground mt-1">
          Os prédios aparecerão aqui quando forem cadastrados
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {buildings.map((building) => (
        <BuildingMobileCard
          key={building.id}
          building={building}
          videoCount={videoCounts[building.id]}
          panelsStatus={panelsStatusMap?.[building.id]}
          panelsStatusLoading={panelsStatusLoading}
          onView={onView}
          onEdit={onEdit}
          onImageManager={onImageManager}
          onViewPlaylist={onViewPlaylist}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
