
import { useState } from 'react';
import { toast } from 'sonner';

export const useBuildingActions = (deleteBuilding: (id: string) => Promise<void>, refetch: () => void) => {
  const [selectedBuilding, setSelectedBuilding] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isImageManagerOpen, setIsImageManagerOpen] = useState(false);
  const [operationLoading, setOperationLoading] = useState(false);

  // INVESTIGAÇÃO: Log detalhado de todas as mudanças de estado
  const logStateChange = (action: string, newState: any) => {
    console.log(`🔍 [BUILDING ACTIONS - ${action}] Estado atual:`, {
      timestamp: new Date().toISOString(),
      selectedBuilding: newState.selectedBuilding ? {
        id: newState.selectedBuilding.id,
        nome: newState.selectedBuilding.nome
      } : null,
      isDetailsOpen: newState.isDetailsOpen,
      isFormOpen: newState.isFormOpen,
      isImageManagerOpen: newState.isImageManagerOpen,
      operationLoading: newState.operationLoading
    });
  };

  const handleDeleteBuilding = async (building: any) => {
    console.log('🗑️ [BUILDING ACTIONS] INÍCIO - handleDeleteBuilding:', building?.nome);
    
    if (!building?.id) {
      console.error('❌ [BUILDING ACTIONS] Dados do prédio inválidos para exclusão');
      toast.error('Erro: Dados do prédio inválidos para exclusão');
      return;
    }

    if (window.confirm(`Tem certeza que deseja excluir o prédio "${building.nome}"? Esta ação não pode ser desfeita.`)) {
      setOperationLoading(true);
      
      try {
        if (isDetailsOpen) {
          console.log('🔄 [BUILDING ACTIONS] Fechando dialog de detalhes antes da exclusão');
          setIsDetailsOpen(false);
          setSelectedBuilding(null);
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        console.log('🔄 [BUILDING ACTIONS] Executando exclusão...');
        await deleteBuilding(building.id);
        
        console.log('✅ [BUILDING ACTIONS] Prédio excluído com sucesso');
        toast.success(`Prédio "${building.nome}" excluído com sucesso!`);
        refetch();
        
      } catch (error) {
        console.error('❌ [BUILDING ACTIONS] Erro ao excluir prédio:', error);
        toast.error('Erro ao excluir prédio: ' + (error as any)?.message || 'Erro desconhecido');
      } finally {
        setOperationLoading(false);
      }
    }
  };

  const handleNewBuilding = () => {
    console.log('➕ [BUILDING ACTIONS] INÍCIO - handleNewBuilding');
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
    console.log('👁️ [BUILDING ACTIONS] INÍCIO - handleViewBuilding:', building?.nome);
    
    if (!building || !building.id) {
      console.error('❌ [BUILDING ACTIONS] Tentativa de visualizar prédio inválido:', building);
      toast.error('Erro: Dados do prédio inválidos');
      return;
    }

    // CORREÇÃO CRÍTICA: Estado estável e validado
    const newState = {
      selectedBuilding: { ...building }, // Clone para evitar referências
      isDetailsOpen: true,
      isFormOpen: false,
      isImageManagerOpen: false,
      operationLoading: false
    };

    console.log('🔍 [BUILDING ACTIONS] Validando dados antes de abrir:', {
      building_id: building.id,
      building_nome: building.nome,
      has_valid_data: !!(building.id && building.nome)
    });

    // Aplicar mudanças de estado de forma síncrona
    setSelectedBuilding({ ...building });
    setIsFormOpen(false);
    setIsDetailsOpen(true);
    
    logStateChange('VIEW_BUILDING', newState);
    console.log('✅ [BUILDING ACTIONS] handleViewBuilding COMPLETO');
  };

  const handleEditBuilding = (building: any) => {
    console.log('✏️ [BUILDING ACTIONS] INÍCIO - handleEditBuilding:', building?.nome);
    
    if (!building || !building.id) {
      console.error('❌ [BUILDING ACTIONS] Tentativa de editar prédio inválido');
      toast.error('Erro: Dados do prédio inválidos');
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
    console.log('🖼️ [BUILDING ACTIONS] INÍCIO - handleImageManager:', building?.nome);
    
    if (!building || !building.id) {
      console.error('❌ [BUILDING ACTIONS] Tentativa de gerenciar imagens de prédio inválido');
      toast.error('Erro: Dados do prédio inválidos');
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

  const handleSuccess = () => {
    console.log('✅ [BUILDING ACTIONS] INÍCIO - handleSuccess');
    
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
    console.log('🔄 [BUILDING ACTIONS] INÍCIO - handleCloseDetails:', open);
    
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
    handleEditBuilding,
    handleImageManager,
    handleSuccess,
    handleCloseDetails
  };
};
