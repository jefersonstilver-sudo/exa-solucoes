
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import BuildingsPageHeader from './BuildingsPageHeader';
import AdminBuildingsConnectionStatus from './AdminBuildingsConnectionStatus';
import AdminBuildingStatsCards from './AdminBuildingStatsCards';
import BuildingSearchSection from './BuildingSearchSection';
import AdminBuildingsContentSection from './AdminBuildingsContentSection';
import BuildingFormDialog from './BuildingFormDialog';

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
  onDelete
}) => {
  const { userProfile } = useAuth();

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
