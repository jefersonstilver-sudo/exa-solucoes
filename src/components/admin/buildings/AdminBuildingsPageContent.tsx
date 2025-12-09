
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import BuildingsPageHeader from './BuildingsPageHeader';
import AdminBuildingsConnectionStatus from './AdminBuildingsConnectionStatus';
import AdminBuildingStatsCards from './AdminBuildingStatsCards';
import BuildingSearchSection from './BuildingSearchSection';
import AdminBuildingsContentSection from './AdminBuildingsContentSection';
import BuildingFormDialog from './BuildingFormDialog';
import MobileBuildingsPageV2 from './mobile/MobileBuildingsPageV2';

interface AdminBuildingsPageContentProps {
  buildings: any[];
  stats: any;
  loading: boolean;
  refetch: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  showFormDialog: boolean;
  onFormDialogChange: (show: boolean) => void;
  selectedBuilding: any;
  onNewBuilding: () => void;
  onView: (building: any) => void;
  onEdit: (building: any) => void;
  onImageManager: (building: any) => void;
  onDelete: (building: any) => void;
  onViewPlaylist?: (building: any) => void;
}

const AdminBuildingsPageContent: React.FC<AdminBuildingsPageContentProps> = ({
  buildings,
  stats,
  loading,
  refetch,
  searchTerm,
  onSearchChange,
  showFormDialog,
  onFormDialogChange,
  selectedBuilding,
  onNewBuilding,
  onView,
  onEdit,
  onImageManager,
  onDelete,
  onViewPlaylist
}) => {
  const { userProfile } = useAuth();
  const isMobile = useIsMobile();

  // Use mobile layout on mobile devices
  if (isMobile) {
    return (
      <MobileBuildingsPageV2
        buildings={buildings}
        stats={stats}
        loading={loading}
        refetch={refetch}
        showFormDialog={showFormDialog}
        onFormDialogChange={onFormDialogChange}
        selectedBuilding={selectedBuilding}
        onNewBuilding={onNewBuilding}
        onView={onView}
        onEdit={onEdit}
        onImageManager={onImageManager}
        onDelete={onDelete}
      />
    );
  }

  return (
    <div className="space-y-6">
      <BuildingsPageHeader
        loading={loading}
        onRefresh={refetch}
        onNewBuilding={onNewBuilding}
      />

      <AdminBuildingsConnectionStatus
        buildingsCount={buildings.length}
        activeCount={buildings.filter(b => b.status === 'ativo').length}
        maintenanceCount={buildings.filter(b => b.status === 'manutenção').length}
        installationCount={buildings.filter(b => b.status === 'instalação').length}
        inactiveCount={buildings.filter(b => b.status === 'inativo').length}
        userEmail={userProfile?.email}
      />

      <AdminBuildingStatsCards stats={stats} />

      <BuildingSearchSection
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
      />

      <AdminBuildingsContentSection
        buildings={buildings}
        searchTerm={searchTerm}
        userEmail={userProfile?.email}
        onView={onView}
        onEdit={onEdit}
        onImageManager={onImageManager}
        onDelete={onDelete}
        onViewPlaylist={onViewPlaylist}
      />

      <BuildingFormDialog
        open={showFormDialog}
        onOpenChange={onFormDialogChange}
        building={selectedBuilding}
        onSuccess={refetch}
      />
    </div>
  );
};

export default AdminBuildingsPageContent;
