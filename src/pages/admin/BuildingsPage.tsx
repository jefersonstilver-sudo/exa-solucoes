
import React from 'react';
import { useAdminBuildingsData } from '@/hooks/useAdminBuildingsData';
import { useBuildingsPageHandlers } from '@/hooks/useBuildingsPageHandlers';
import BuildingsPageLoader from '@/components/admin/buildings/BuildingsPageLoader';
import AdminBuildingsPageContent from '@/components/admin/buildings/AdminBuildingsPageContent';

const BuildingsPage = () => {
  const { buildings, stats, loading, refetch } = useAdminBuildingsData();
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
    <AdminBuildingsPageContent
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
