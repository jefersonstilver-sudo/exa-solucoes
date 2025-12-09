import React, { useState } from 'react';
import MobileBuildingsHeader from './MobileBuildingsHeader';
import MobileBuildingsStats from './MobileBuildingsStats';
import MobileBuildingsFilters from './MobileBuildingsFilters';
import MobileBuildingCard from './MobileBuildingCard';
import BuildingFormDialog from '../BuildingFormDialog';
import BuildingsEmptyState from '../BuildingsEmptyState';
import { useBuildingsVideoCount } from '@/hooks/useBuildingsVideoCount';
import { useBuildingsPanelsStatus } from '@/hooks/useBuildingPanelsStatus';
import { BuildingStats } from '@/services/buildingsStatsService';

interface MobileBuildingsPageProps {
  buildings: any[];
  stats: BuildingStats;
  loading: boolean;
  refetch: () => void;
  showFormDialog: boolean;
  onFormDialogChange: (show: boolean) => void;
  selectedBuilding: any;
  onNewBuilding: () => void;
  onView: (building: any) => void;
  onEdit: (building: any) => void;
  onImageManager: (building: any) => void;
  onDelete: (building: any) => void;
}

const MobileBuildingsPage: React.FC<MobileBuildingsPageProps> = ({
  buildings,
  stats,
  loading,
  refetch,
  showFormDialog,
  onFormDialogChange,
  selectedBuilding,
  onNewBuilding,
  onView,
  onEdit,
  onImageManager,
  onDelete
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Filter buildings
  const filteredBuildings = buildings.filter(building => {
    const matchesSearch = 
      building.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      building.endereco.toLowerCase().includes(searchTerm.toLowerCase()) ||
      building.bairro.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || 
      building.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const activeCount = buildings.filter(b => b.status === 'ativo').length;
  const inactiveCount = buildings.filter(b => b.status !== 'ativo').length;

  // Get video counts and panel status
  const buildingIds = filteredBuildings.map(b => b.id);
  const { counts: videoCounts } = useBuildingsVideoCount(buildingIds);
  const { data: panelsStatuses, isLoading: panelsLoading } = useBuildingsPanelsStatus(buildingIds);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-slate-100">
      <div className="px-4 py-3 space-y-4 pb-24">
        {/* Header */}
        <MobileBuildingsHeader
          loading={loading}
          onRefresh={refetch}
          onNewBuilding={onNewBuilding}
        />

        {/* Stats Row */}
        <MobileBuildingsStats stats={stats} />

        {/* Search & Filters */}
        <MobileBuildingsFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          totalCount={buildings.length}
          activeCount={activeCount}
          inactiveCount={inactiveCount}
        />

        {/* Buildings List */}
        <div className="space-y-3">
          {filteredBuildings.length === 0 ? (
            <BuildingsEmptyState
              buildingsCount={buildings.length}
              searchTerm={searchTerm}
            />
          ) : (
            filteredBuildings.map((building) => (
              <MobileBuildingCard
                key={building.id}
                building={building}
                videoCount={videoCounts[building.id] ?? 0}
                panelsStatus={panelsStatuses[building.id]}
                panelsStatusLoading={panelsLoading}
                onView={onView}
                onEdit={onEdit}
                onImageManager={onImageManager}
                onDelete={onDelete}
              />
            ))
          )}
        </div>
      </div>

      {/* Form Dialog */}
      <BuildingFormDialog
        open={showFormDialog}
        onOpenChange={onFormDialogChange}
        building={selectedBuilding}
        onSuccess={refetch}
      />
    </div>
  );
};

export default MobileBuildingsPage;
