
import React from 'react';
import BuildingFormDialog from './BuildingFormDialog';
import SafeBuildingDetailsDialog from './safe/SafeBuildingDetailsDialog';
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
  return (
    <>
      <BuildingFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        building={selectedBuilding}
        onSuccess={onSuccess}
      />

      <SafeBuildingDetailsDialog
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
