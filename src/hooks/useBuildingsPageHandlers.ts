import { useState } from 'react';

export const useBuildingsPageHandlers = (refetch: () => void) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [playlistBuilding, setPlaylistBuilding] = useState<any>(null);

  const handleNewBuilding = () => {
    setSelectedBuilding(null);
    setShowFormDialog(true);
  };

  const handleEditBuilding = (building: any) => {
    setSelectedBuilding(building);
    setShowFormDialog(true);
  };

  const handleViewBuilding = (building: any) => {
    console.log('View building:', building);
  };

  const handleImageManager = (building: any) => {
    console.log('Image manager for building:', building);
  };

  const handleDeleteBuilding = (building: any) => {
    console.log('Delete building:', building);
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
    handleDeleteBuilding,
    playlistBuilding,
    setPlaylistBuilding
  };
};