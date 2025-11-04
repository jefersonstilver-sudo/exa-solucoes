import React from 'react';
import { RefreshCw, Building2, Plus, Filter } from 'lucide-react';
import { useAdminBuildingsData } from '@/hooks/useAdminBuildingsData';
import { useBuildingsPageHandlers } from '@/hooks/useBuildingsPageHandlers';
import { useAdvancedResponsive } from '@/hooks/useAdvancedResponsive';
import BuildingsPageLoader from '@/components/admin/buildings/BuildingsPageLoader';
import AdminBuildingsPageContent from '@/components/admin/buildings/AdminBuildingsPageContent';
import { BuildingVideoPlaylistModal } from '@/components/admin/buildings/BuildingVideoPlaylistModal';
import { BuildingMobileList } from '@/components/admin/buildings/BuildingMobileList';
import { MobileActionMenu } from '@/components/admin/shared/MobileActionMenu';
import { Button } from '@/components/ui/button';

const BuildingsPage = () => {
  const { isMobile } = useAdvancedResponsive();
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

  // Filter buildings based on search
  const filteredBuildings = buildings.filter(building =>
    building.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    building.bairro?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    building.endereco?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Mobile Actions Menu
  const mobileMenuItems = [
    {
      icon: <RefreshCw className="h-4 w-4" />,
      label: 'Atualizar',
      onClick: refetch,
    },
    {
      icon: <Plus className="h-4 w-4" />,
      label: 'Novo Prédio',
      onClick: handleNewBuilding,
    },
  ];

  // Mobile Layout
  if (isMobile) {
    return (
      <>
        <div className="min-h-screen bg-background pb-20">
          {/* Mobile Header */}
          <div className="sticky top-0 z-10 bg-gradient-to-r from-[#9C1E1E] to-[#DC2626] border-b border-white/20 shadow-lg">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white">Prédios</h1>
                    <p className="text-sm text-white/90">
                      {stats.total} prédios cadastrados
                    </p>
                  </div>
                </div>
                <MobileActionMenu items={mobileMenuItems} />
              </div>
            </div>
          </div>

          {/* Mobile Stats - Compact */}
          <div className="p-4 bg-white border-b">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-bold text-foreground">{stats.total}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ativos</p>
                <p className="text-lg font-bold text-green-600">{stats.active}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Painéis</p>
                <p className="text-lg font-bold text-blue-600">{stats.totalPanels}</p>
              </div>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="p-4 bg-white border-b">
            <input
              type="text"
              placeholder="🔍 Buscar prédio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          {/* Mobile Building List */}
          <div className="p-4">
            <BuildingMobileList
              buildings={filteredBuildings}
              loading={loading}
              onView={handleViewBuilding}
              onEdit={handleEditBuilding}
              onImageManager={handleImageManager}
              onViewPlaylist={handleViewPlaylist}
            />
          </div>

          {/* Floating Action Button */}
          <Button
            onClick={handleNewBuilding}
            className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-[#9C1E1E] to-[#DC2626] hover:from-[#7A1818] hover:to-[#B91C1C] text-white"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>

        <BuildingVideoPlaylistModal
          open={!!playlistBuilding}
          onOpenChange={(open) => !open && setPlaylistBuilding(null)}
          buildingId={playlistBuilding?.id || ''}
          buildingName={playlistBuilding?.nome || ''}
        />
      </>
    );
  }

  // Desktop Layout (unchanged)
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