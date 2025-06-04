
import React from 'react';
import BuildingFormDialog from './BuildingFormDialog';
import BuildingDetailsDialog from './BuildingDetailsDialog';
import BuildingImageManager from './BuildingImageManager';

interface BuildingsDialogSectionProps {
  isFormOpen: boolean;
  setIsFormOpen: (open: boolean) => void;
  selectedBuilding: any;
  onSuccess: () => void;
  isDetailsOpen: boolean;
  onCloseDetails: (open: boolean) => void;
  isImageManagerOpen: boolean;
  setIsImageManagerOpen: (open: boolean) => void;
  refetch: () => void;
}

const BuildingsDialogSection: React.FC<BuildingsDialogSectionProps> = ({
  isFormOpen,
  setIsFormOpen,
  selectedBuilding,
  onSuccess,
  isDetailsOpen,
  onCloseDetails,
  isImageManagerOpen,
  setIsImageManagerOpen,
  refetch
}) => {
  console.log('🏗️ [BUILDINGS DIALOG SECTION] Renderizando dialogs:', {
    isFormOpen,
    isDetailsOpen,
    isImageManagerOpen,
    hasSelectedBuilding: !!selectedBuilding,
    buildingName: selectedBuilding?.nome || 'null'
  });

  return (
    <>
      <BuildingFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        building={selectedBuilding}
        onSuccess={onSuccess}
      />

      <BuildingDetailsDialog
        open={isDetailsOpen}
        onOpenChange={onCloseDetails}
        building={selectedBuilding}
      />

      <BuildingImageManager
        open={isImageManagerOpen}
        onOpenChange={setIsImageManagerOpen}
        building={selectedBuilding}
        onImagesUpdate={refetch}
      />
    </>
  );
};

export default BuildingsDialogSection;
