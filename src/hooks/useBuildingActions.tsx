
import { useState } from 'react';
import { toast } from 'sonner';

export const useBuildingActions = (deleteBuilding: (id: string) => Promise<void>, refetch: () => void) => {
  const [selectedBuilding, setSelectedBuilding] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isImageManagerOpen, setIsImageManagerOpen] = useState(false);
  const [operationLoading, setOperationLoading] = useState(false);

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
          setIsDetailsOpen(false);
          setSelectedBuilding(null);
          
          // Aguardar um momento para o dialog fechar completamente
          await new Promise(resolve => setTimeout(resolve, 200));
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

    // CORREÇÃO: Definir building e abrir dialog diretamente, sem transições complexas
    console.log('✅ [BUILDING ACTIONS] Abrindo detalhes do prédio:', building.nome);
    setSelectedBuilding(building);
    setIsFormOpen(false);
    setIsDetailsOpen(true);
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
    
    if (!open) {
      // CORREÇÃO: Fechar de forma simples e direta
      setIsDetailsOpen(false);
      setSelectedBuilding(null);
    } else {
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
    dialogTransitioning: false, // Removido o estado de transição complexa
    handleDeleteBuilding,
    handleNewBuilding,
    handleViewBuilding,
    handleEditBuilding,
    handleImageManager,
    handleSuccess,
    handleCloseDetails
  };
};
