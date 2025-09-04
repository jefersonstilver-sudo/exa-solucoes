import React from 'react';
import { useAdminBuildingsData } from '@/hooks/useAdminBuildingsData';
import { useBuildingsPageHandlers } from '@/hooks/useBuildingsPageHandlers';
import BuildingsPageLoader from '@/components/admin/buildings/BuildingsPageLoader';
import AdminBuildingsPageContent from '@/components/admin/buildings/AdminBuildingsPageContent';
import { BuildingVideoPlaylistModal } from '@/components/admin/buildings/BuildingVideoPlaylistModal';

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
    handleDeleteBuilding,
    playlistBuilding,
    setPlaylistBuilding
  } = useBuildingsPageHandlers(refetch);

  const handleViewPlaylist = (building: any) => {
    setPlaylistBuilding(building);
  };

  if (loading) {
    return <BuildingsPageLoader />;
  }

  return (
    <>
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
        onViewPlaylist={handleViewPlaylist}
      />
      
      <BuildingVideoPlaylistModal
        open={!!playlistBuilding}
        onOpenChange={(open) => !open && setPlaylistBuilding(null)}
        buildingId={playlistBuilding?.id || ''}
        buildingName={playlistBuilding?.nome || ''}
      />
    </>
  );
};

export default BuildingsPage;