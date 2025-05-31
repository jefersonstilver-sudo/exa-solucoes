
import React from 'react';
import { useBuildingsData } from '@/hooks/useBuildingsData';
import { useBuildingsPageHandlers } from '@/hooks/useBuildingsPageHandlers';
import BuildingsPageLoader from '@/components/admin/buildings/BuildingsPageLoader';
import BuildingsPageContent from '@/components/admin/buildings/BuildingsPageContent';

const BuildingsPage = () => {
  const { buildings, stats, loading, refetch } = useBuildingsData();
  const {
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
  } = useBuildingsPageHandlers(refetch);

  if (loading) {
    return <BuildingsPageLoader />;
  }

  return (
    <BuildingsPageContent
      buildings={buildings}
      stats={stats}
      loading={loading}
      refetch={refetch}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      showFormDialog={showFormDialog}
      onFormDialogChange={setShowFormDialog}
      selectedBuilding={selectedBuilding}
      onNewBuilding={handleNewBuilding}
      onView={handleViewBuilding}
      onEdit={handleEditBuilding}
      onImageManager={handleImageManager}
      onDelete={handleDeleteBuilding}
    />
  );
};

export default BuildingsPage;
