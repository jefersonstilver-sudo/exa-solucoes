
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import BuildingsPageHeader from './BuildingsPageHeader';
import BuildingsConnectionStatus from './BuildingsConnectionStatus';
import BuildingsMainStats from './BuildingsMainStats';
import BuildingSearchSection from './BuildingSearchSection';
import BuildingsContentSection from './BuildingsContentSection';
import BuildingFormDialog from './BuildingFormDialog';

interface BuildingsPageContentProps {
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

const BuildingsPageContent: React.FC<BuildingsPageContentProps> = ({
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

      <BuildingsConnectionStatus
        buildingsCount={buildings.length}
        userEmail={userProfile?.email}
      />

      <BuildingsMainStats stats={stats} />

      <BuildingSearchSection
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
      />

      <BuildingsContentSection
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

export default BuildingsPageContent;
