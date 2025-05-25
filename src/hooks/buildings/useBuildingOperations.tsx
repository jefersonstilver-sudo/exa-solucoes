
import { toast } from 'sonner';
import { useBuildingValidation } from './useBuildingValidation';
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
  const { validateBuildingData } = useBuildingValidation();
  const { logStateChange } = useBuildingLogger();

  const handleDeleteBuilding = async (building: any) => {
    console.log('🗑️ [BUILDING OPERATIONS] INÍCIO - handleDeleteBuilding:', building?.nome);
    
    if (!validateBuildingData(building, 'exclusão')) {
      return;
    }

    if (window.confirm(`Tem certeza que deseja excluir o prédio "${building.nome}"? Esta ação não pode ser desfeita.`)) {
      setOperationLoading(true);
      
      try {
        if (isDetailsOpen) {
          console.log('🔄 [BUILDING OPERATIONS] Fechando dialog de detalhes antes da exclusão');
          setIsDetailsOpen(false);
          setSelectedBuilding(null);
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        console.log('🔄 [BUILDING OPERATIONS] Executando exclusão...');
        await deleteBuilding(building.id);
        
        console.log('✅ [BUILDING OPERATIONS] Prédio excluído com sucesso');
        toast.success(`Prédio "${building.nome}" excluído com sucesso!`);
        refetch();
        
      } catch (error) {
        console.error('❌ [BUILDING OPERATIONS] Erro ao excluir prédio:', error);
        toast.error('Erro ao excluir prédio: ' + (error as any)?.message || 'Erro desconhecido');
      } finally {
        setOperationLoading(false);
      }
    }
  };

  const handleNewBuilding = () => {
    console.log('➕ [BUILDING OPERATIONS] INÍCIO - handleNewBuilding');
    const newState = {
      selectedBuilding: null,
      isDetailsOpen: false,
      isFormOpen: true,
      isImageManagerOpen: false,
      operationLoading: false
    };
    
    setSelectedBuilding(null);
    setIsDetailsOpen(false);
    setIsFormOpen(true);
    
    logStateChange('NEW_BUILDING', newState);
  };

  const handleViewBuilding = (building: any) => {
    console.log('👁️ [BUILDING OPERATIONS] INÍCIO - handleViewBuilding:', building?.nome);
    
    if (!validateBuildingData(building, 'visualização')) {
      return;
    }

    const newState = {
      selectedBuilding: { ...building },
      isDetailsOpen: true,
      isFormOpen: false,
      isImageManagerOpen: false,
      operationLoading: false
    };

    console.log('🔍 [BUILDING OPERATIONS] Validando dados antes de abrir:', {
      building_id: building.id,
      building_nome: building.nome,
      has_valid_data: !!(building.id && building.nome)
    });

    setSelectedBuilding({ ...building });
    setIsFormOpen(false);
    setIsDetailsOpen(true);
    
    logStateChange('VIEW_BUILDING', newState);
    console.log('✅ [BUILDING OPERATIONS] handleViewBuilding COMPLETO');
  };

  const handleEditBuilding = (building: any) => {
    console.log('✏️ [BUILDING OPERATIONS] INÍCIO - handleEditBuilding:', building?.nome);
    
    if (!validateBuildingData(building, 'edição')) {
      return;
    }

    const newState = {
      selectedBuilding: { ...building },
      isDetailsOpen: false,
      isFormOpen: true,
      isImageManagerOpen: false,
      operationLoading: false
    };

    setIsDetailsOpen(false);
    setSelectedBuilding({ ...building });
    setIsFormOpen(true);
    
    logStateChange('EDIT_BUILDING', newState);
  };

  const handleImageManager = (building: any) => {
    console.log('🖼️ [BUILDING OPERATIONS] INÍCIO - handleImageManager:', building?.nome);
    
    if (!validateBuildingData(building, 'gerenciamento de imagens')) {
      return;
    }

    const newState = {
      selectedBuilding: { ...building },
      isDetailsOpen: false,
      isFormOpen: false,
      isImageManagerOpen: true,
      operationLoading: false
    };

    setSelectedBuilding({ ...building });
    setIsImageManagerOpen(true);
    
    logStateChange('IMAGE_MANAGER', newState);
  };

  return {
    handleDeleteBuilding,
    handleNewBuilding,
    handleViewBuilding,
    handleEditBuilding,
    handleImageManager
  };
};
