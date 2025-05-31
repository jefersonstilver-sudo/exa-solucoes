
import { useState } from 'react';

export const useBuildingsPageHandlers = (refetch: () => void) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState(null);

  const handleNewBuilding = () => {
    setSelectedBuilding(null);
    setShowFormDialog(true);
  };

  const handleEditBuilding = (building: any) => {
    setSelectedBuilding(building);
    setShowFormDialog(true);
  };

  const handleViewBuilding = (building: any) => {
    console.log('Ver detalhes do prédio:', building);
  };

  const handleImageManager = (building: any) => {
    console.log('Gerenciar imagens do prédio:', building);
  };

  const handleDeleteBuilding = (building: any) => {
    console.log('Excluir prédio:', building);
  };

  return {
    searchTerm,
    setSearchTerm,
    showFormDialog,
    setShowFormDialog,
    selectedBuilding,
    handleNewBuilding,
    handleEditBuilding,
    handleViewBuilding,
    handleImageManager,
    handleDeleteBuilding
  };
};
