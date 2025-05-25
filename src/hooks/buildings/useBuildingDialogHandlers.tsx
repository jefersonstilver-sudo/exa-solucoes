
import { useBuildingLogger } from './useBuildingLogger';

interface UseBuildingDialogHandlersProps {
  setIsFormOpen: (open: boolean) => void;
  setSelectedBuilding: (building: any) => void;
  setIsDetailsOpen: (open: boolean) => void;
  refetch: () => void;
}

export const useBuildingDialogHandlers = ({
  setIsFormOpen,
  setSelectedBuilding,
  setIsDetailsOpen,
  refetch
}: UseBuildingDialogHandlersProps) => {
  const { logStateChange } = useBuildingLogger();

  const handleSuccess = () => {
    console.log('✅ [BUILDING DIALOG] INÍCIO - handleSuccess');
    
    const newState = {
      selectedBuilding: null,
      isDetailsOpen: false,
      isFormOpen: false,
      isImageManagerOpen: false,
      operationLoading: false
    };

    setIsFormOpen(false);
    setSelectedBuilding(null);
    refetch();
    
    logStateChange('SUCCESS', newState);
  };

  const handleCloseDetails = (open: boolean) => {
    console.log('🔄 [BUILDING DIALOG] INÍCIO - handleCloseDetails:', open);
    
    if (!open) {
      const newState = {
        selectedBuilding: null,
        isDetailsOpen: false,
        isFormOpen: false,
        isImageManagerOpen: false,
        operationLoading: false
      };

      setIsDetailsOpen(false);
      setSelectedBuilding(null);
      
      logStateChange('CLOSE_DETAILS', newState);
    } else {
      setIsDetailsOpen(true);
      logStateChange('OPEN_DETAILS', { isDetailsOpen: true });
    }
  };

  return {
    handleSuccess,
    handleCloseDetails
  };
};
