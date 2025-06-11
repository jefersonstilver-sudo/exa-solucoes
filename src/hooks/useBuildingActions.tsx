
import { useBuildingState } from './buildings/useBuildingState';
import { useBuildingOperations } from './buildings/useBuildingOperations';
import { useBuildingDialogHandlers } from './buildings/useBuildingDialogHandlers';

export const useBuildingActions = (deleteBuilding: (id: string) => Promise<void>, refetch: () => void) => {
  const {
    selectedBuilding,
    setSelectedBuilding,
    isFormOpen,
    setIsFormOpen,
    isDetailsOpen,
    setIsDetailsOpen,
    isImageManagerOpen,
    setIsImageManagerOpen,
    operationLoading,
    setOperationLoading
  } = useBuildingState();

  const {
    handleDeleteBuilding,
    handleNewBuilding,
    handleViewBuilding,
    handleViewCampaigns,
    handleEditBuilding,
    handleImageManager
  } = useBuildingOperations({
    selectedBuilding,
    setSelectedBuilding,
    isDetailsOpen,
    setIsDetailsOpen,
    isFormOpen,
    setIsFormOpen,
    isImageManagerOpen,
    setIsImageManagerOpen,
    operationLoading,
    setOperationLoading,
    deleteBuilding,
    refetch
  });

  const {
    handleSuccess,
    handleCloseDetails
  } = useBuildingDialogHandlers({
    setIsFormOpen,
    setSelectedBuilding,
    setIsDetailsOpen,
    refetch
  });

  return {
    selectedBuilding,
    isFormOpen,
    setIsFormOpen,
    isDetailsOpen,
    isImageManagerOpen,
    setIsImageManagerOpen,
    operationLoading,
    handleDeleteBuilding,
    handleNewBuilding,
    handleViewBuilding,
    handleViewCampaigns,
    handleEditBuilding,
    handleImageManager,
    handleSuccess,
    handleCloseDetails
  };
};
