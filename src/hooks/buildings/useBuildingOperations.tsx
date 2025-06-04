
import { useBuildingLogger } from './useBuildingLogger';

interface UseBuildingOperationsProps {
  selectedBuilding: any;
  setSelectedBuilding: (building: any) => void;
  isDetailsOpen: boolean;
  setIsDetailsOpen: (open: boolean) => void;
  isFormOpen: boolean;
  setIsFormOpen: (open: boolean) => void;
  isImageManagerOpen: boolean;
  setIsImageManagerOpen: (open: boolean) => void;
  operationLoading: boolean;
  setOperationLoading: (loading: boolean) => void;
  deleteBuilding: (id: string) => Promise<void>;
  refetch: () => void;
}

export const useBuildingOperations = ({
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
}: UseBuildingOperationsProps) => {
  const { logStateChange } = useBuildingLogger();

  const handleViewBuilding = (building: any) => {
    console.log('👁️ [BUILDING OPERATIONS] INÍCIO - handleViewBuilding para:', building?.nome);
    
    if (!building) {
      console.error('❌ [BUILDING OPERATIONS] Building não fornecido para visualização');
      return;
    }

    const newState = {
      selectedBuilding: building,
      isDetailsOpen: true,
      isFormOpen: false,
      isImageManagerOpen: false,
      operationLoading: false
    };

    setSelectedBuilding(building);
    setIsDetailsOpen(true);
    setIsFormOpen(false);
    setIsImageManagerOpen(false);
    
    logStateChange('VIEW_BUILDING', newState);
    console.log('✅ [BUILDING OPERATIONS] Dialog de detalhes deve abrir para:', building.nome);
  };

  const handleEditBuilding = (building: any) => {
    console.log('✏️ [BUILDING OPERATIONS] INÍCIO - handleEditBuilding para:', building?.nome);
    
    const newState = {
      selectedBuilding: building,
      isDetailsOpen: false,
      isFormOpen: true,
      isImageManagerOpen: false,
      operationLoading: false
    };

    setSelectedBuilding(building);
    setIsFormOpen(true);
    setIsDetailsOpen(false);
    setIsImageManagerOpen(false);
    
    logStateChange('EDIT_BUILDING', newState);
  };

  const handleNewBuilding = () => {
    console.log('🆕 [BUILDING OPERATIONS] INÍCIO - handleNewBuilding');
    
    const newState = {
      selectedBuilding: null,
      isDetailsOpen: false,
      isFormOpen: true,
      isImageManagerOpen: false,
      operationLoading: false
    };

    setSelectedBuilding(null);
    setIsFormOpen(true);
    setIsDetailsOpen(false);
    setIsImageManagerOpen(false);
    
    logStateChange('NEW_BUILDING', newState);
  };

  const handleImageManager = (building: any) => {
    console.log('🖼️ [BUILDING OPERATIONS] INÍCIO - handleImageManager para:', building?.nome);
    
    const newState = {
      selectedBuilding: building,
      isDetailsOpen: false,
      isFormOpen: false,
      isImageManagerOpen: true,
      operationLoading: false
    };

    setSelectedBuilding(building);
    setIsImageManagerOpen(true);
    setIsDetailsOpen(false);
    setIsFormOpen(false);
    
    logStateChange('IMAGE_MANAGER', newState);
  };

  const handleDeleteBuilding = async (building: any) => {
    console.log('🗑️ [BUILDING OPERATIONS] INÍCIO - handleDeleteBuilding para:', building?.nome);
    
    if (window.confirm(`Tem certeza que deseja excluir o prédio "${building.nome}"?`)) {
      setOperationLoading(true);
      
      try {
        await deleteBuilding(building.id);
        refetch();
        
        logStateChange('DELETE_BUILDING_SUCCESS', {
          operationLoading: false
        });
      } catch (error) {
        console.error('❌ [BUILDING OPERATIONS] Erro ao deletar prédio:', error);
        
        logStateChange('DELETE_BUILDING_ERROR', {
          operationLoading: false
        });
      } finally {
        setOperationLoading(false);
      }
    }
  };

  return {
    handleViewBuilding,
    handleEditBuilding,
    handleNewBuilding,
    handleImageManager,
    handleDeleteBuilding
  };
};
