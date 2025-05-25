
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
      toast.error('Erro: Dados do prédio inválidos para exclusão');
      return;
    }

    if (window.confirm(`Tem certeza que deseja excluir o prédio "${building.nome}"? Esta ação não pode ser desfeita.`)) {
      setOperationLoading(true);
      try {
        await deleteBuilding(building.id);
      } catch (error) {
        console.error('❌ [BUILDINGS MANAGEMENT] Erro ao excluir prédio:', error);
        toast.error('Erro ao excluir prédio');
      } finally {
        setOperationLoading(false);
      }
    }
  };

  const handleNewBuilding = () => {
    console.log('➕ [BUILDINGS MANAGEMENT] Criando novo prédio');
    setSelectedBuilding(null);
    setIsFormOpen(true);
  };

  const handleViewBuilding = (building: any) => {
    console.log('👁️ [BUILDINGS MANAGEMENT] Visualizando prédio:', building?.nome);
    
    if (!building || !building.id) {
      console.error('❌ [BUILDINGS MANAGEMENT] Tentativa de visualizar prédio inválido');
      toast.error('Erro: Dados do prédio inválidos');
      return;
    }

    setSelectedBuilding(building);
    setIsDetailsOpen(true);
  };

  const handleEditBuilding = (building: any) => {
    console.log('✏️ [BUILDINGS MANAGEMENT] Editando prédio:', building?.nome);
    
    if (!building || !building.id) {
      console.error('❌ [BUILDINGS MANAGEMENT] Tentativa de editar prédio inválido');
      toast.error('Erro: Dados do prédio inválidos');
      return;
    }

    setSelectedBuilding(building);
    setIsFormOpen(true);
  };

  const handleImageManager = (building: any) => {
    console.log('🖼️ [BUILDINGS MANAGEMENT] Gerenciando imagens:', building?.nome);
    
    if (!building || !building.id) {
      console.error('❌ [BUILDINGS MANAGEMENT] Tentativa de gerenciar imagens de prédio inválido');
      toast.error('Erro: Dados do prédio inválidos');
      return;
    }

    setSelectedBuilding(building);
    setIsImageManagerOpen(true);
  };

  const handleSuccess = () => {
    console.log('✅ [BUILDINGS MANAGEMENT] Operação bem-sucedida');
    setIsFormOpen(false);
    setSelectedBuilding(null);
    refetch();
  };

  const handleCloseDetails = (open: boolean) => {
    console.log('🔄 [BUILDINGS MANAGEMENT] Fechando detalhes:', open);
    setIsDetailsOpen(open);
    if (!open) {
      setTimeout(() => {
        setSelectedBuilding(null);
      }, 100);
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
