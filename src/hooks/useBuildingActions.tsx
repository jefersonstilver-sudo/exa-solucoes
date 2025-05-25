
import { useState } from 'react';
import { toast } from 'sonner';

export const useBuildingActions = (deleteBuilding: (id: string) => Promise<void>, refetch: () => void) => {
  const [selectedBuilding, setSelectedBuilding] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isImageManagerOpen, setIsImageManagerOpen] = useState(false);
  const [operationLoading, setOperationLoading] = useState(false);
  const [dialogTransitioning, setDialogTransitioning] = useState(false);

  const handleDeleteBuilding = async (building: any) => {
    if (!building?.id) {
      console.error('❌ [BUILDING ACTIONS] Dados do prédio inválidos para exclusão');
      toast.error('Erro: Dados do prédio inválidos para exclusão');
      return;
    }

    console.log('🗑️ [BUILDING ACTIONS] Iniciando exclusão do prédio:', building.nome);

    if (window.confirm(`Tem certeza que deseja excluir o prédio "${building.nome}"? Esta ação não pode ser desfeita.`)) {
      setOperationLoading(true);
      
      try {
        // Fechar qualquer dialog aberto antes da exclusão
        if (isDetailsOpen) {
          console.log('🔄 [BUILDING ACTIONS] Fechando dialog de detalhes antes da exclusão');
          setDialogTransitioning(true);
          setIsDetailsOpen(false);
          setSelectedBuilding(null);
          
          // Aguardar um momento para o dialog fechar completamente
          await new Promise(resolve => setTimeout(resolve, 200));
          setDialogTransitioning(false);
        }

        console.log('🔄 [BUILDING ACTIONS] Executando exclusão...');
        await deleteBuilding(building.id);
        
        console.log('✅ [BUILDING ACTIONS] Prédio excluído com sucesso');
        toast.success(`Prédio "${building.nome}" excluído com sucesso!`);
        
        // Atualizar lista após exclusão
        refetch();
        
      } catch (error) {
        console.error('❌ [BUILDING ACTIONS] Erro ao excluir prédio:', error);
        toast.error('Erro ao excluir prédio: ' + (error as any)?.message || 'Erro desconhecido');
      } finally {
        setOperationLoading(false);
        setDialogTransitioning(false);
      }
    }
  };

  const handleNewBuilding = () => {
    console.log('➕ [BUILDING ACTIONS] Criando novo prédio');
    // Garantir estado limpo
    setSelectedBuilding(null);
    setIsDetailsOpen(false);
    setIsFormOpen(true);
  };

  const handleViewBuilding = (building: any) => {
    console.log('👁️ [BUILDING ACTIONS] Visualizando prédio:', building?.nome);
    
    if (!building || !building.id) {
      console.error('❌ [BUILDING ACTIONS] Tentativa de visualizar prédio inválido');
      toast.error('Erro: Dados do prédio inválidos');
      return;
    }

    // Prevenir transições múltiplas
    if (dialogTransitioning) {
      console.log('⏳ [BUILDING ACTIONS] Aguardando transição anterior');
      return;
    }

    setDialogTransitioning(true);
    
    // Limpar estado anterior
    setSelectedBuilding(null);
    setIsDetailsOpen(false);
    setIsFormOpen(false);
    
    // Aguardar um momento antes de definir novo estado
    setTimeout(() => {
      setSelectedBuilding(building);
      setIsDetailsOpen(true);
      setDialogTransitioning(false);
    }, 100);
  };

  const handleEditBuilding = (building: any) => {
    console.log('✏️ [BUILDING ACTIONS] Editando prédio:', building?.nome);
    
    if (!building || !building.id) {
      console.error('❌ [BUILDING ACTIONS] Tentativa de editar prédio inválido');
      toast.error('Erro: Dados do prédio inválidos');
      return;
    }

    // Garantir estado limpo antes de editar
    setIsDetailsOpen(false);
    setSelectedBuilding(building);
    setIsFormOpen(true);
  };

  const handleImageManager = (building: any) => {
    console.log('🖼️ [BUILDING ACTIONS] Gerenciando imagens:', building?.nome);
    
    if (!building || !building.id) {
      console.error('❌ [BUILDING ACTIONS] Tentativa de gerenciar imagens de prédio inválido');
      toast.error('Erro: Dados do prédio inválidos');
      return;
    }

    setSelectedBuilding(building);
    setIsImageManagerOpen(true);
  };

  const handleSuccess = () => {
    console.log('✅ [BUILDING ACTIONS] Operação bem-sucedida');
    setIsFormOpen(false);
    setSelectedBuilding(null);
    refetch();
  };

  const handleCloseDetails = (open: boolean) => {
    console.log('🔄 [BUILDING ACTIONS] Fechando detalhes:', open);
    
    if (!open && !dialogTransitioning) {
      setDialogTransitioning(true);
      setIsDetailsOpen(false);
      
      // Aguardar um momento antes de limpar o building selecionado
      setTimeout(() => {
        setSelectedBuilding(null);
        setDialogTransitioning(false);
      }, 150);
    } else if (open) {
      setIsDetailsOpen(true);
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
    dialogTransitioning,
    handleDeleteBuilding,
    handleNewBuilding,
    handleViewBuilding,
    handleEditBuilding,
    handleImageManager,
    handleSuccess,
    handleCloseDetails
  };
};
