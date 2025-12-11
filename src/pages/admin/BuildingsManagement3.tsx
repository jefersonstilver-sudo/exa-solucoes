import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useAdminBuildingsData } from '@/hooks/useAdminBuildingsData';
import { useBuildingActions } from '@/hooks/useBuildingActions';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import BuildingsHeader3 from '@/components/admin/buildings/v3/BuildingsHeader3';
import BuildingsFilters3 from '@/components/admin/buildings/v3/BuildingsFilters3';
import BuildingsList3 from '@/components/admin/buildings/v3/BuildingsList3';
import BuildingFormDialog3 from '@/components/admin/buildings/v3/BuildingFormDialog3';
import BuildingDetailsDialog from '@/components/admin/buildings/BuildingDetailsDialog';
import BuildingImageManager from '@/components/admin/buildings/BuildingImageManager';

const BuildingsManagement3 = () => {
  const { buildings, stats, loading, refetch, deleteBuilding } = useAdminBuildingsData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    bairro: 'all',
    padrao_publico: 'all'
  });

  const {
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
    handleViewCampaigns,
    handleEditBuilding,
    handleImageManager,
    handleSuccess,
    handleCloseDetails
  } = useBuildingActions(deleteBuilding, refetch);

  const filteredBuildings = buildings.filter(building => {
    const matchesSearch = building.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         building.endereco.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         building.bairro.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filters.status === 'all' || building.status === filters.status;
    const matchesBairro = filters.bairro === 'all' || building.bairro === filters.bairro;
    const matchesPadrao = filters.padrao_publico === 'all' || building.padrao_publico === filters.padrao_publico;
    
    return matchesSearch && matchesStatus && matchesBairro && matchesPadrao;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-[#9C1E1E]" />
        <span className="ml-2 text-gray-600 text-sm">Carregando...</span>
      </div>
    );
  }

  return (
    <ErrorBoundary
      onError={(error) => {
        console.error('🚨 [BUILDINGS 3.0] Erro crítico:', error);
      }}
    >
      <LoadingOverlay isLoading={operationLoading} message="Processando...">
        <div className="space-y-4 pb-8">
          <BuildingsHeader3
            stats={stats}
            loading={loading}
            onRefresh={refetch}
            onNewBuilding={handleNewBuilding}
          />

          <BuildingsFilters3
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filters={filters}
            onFiltersChange={setFilters}
            buildings={buildings}
          />

          <BuildingsList3
            buildings={filteredBuildings}
            onView={handleViewBuilding}
            onEdit={handleEditBuilding}
            onImageManager={handleImageManager}
            onDelete={handleDeleteBuilding}
            onViewCampaigns={handleViewCampaigns}
          />

          {/* Form Dialog */}
          <BuildingFormDialog3
            open={isFormOpen}
            onOpenChange={setIsFormOpen}
            building={selectedBuilding}
            onSuccess={handleSuccess}
          />

          {/* Details Dialog */}
          {selectedBuilding && (
            <BuildingDetailsDialog
              building={selectedBuilding}
              open={isDetailsOpen}
              onOpenChange={handleCloseDetails}
            />
          )}

          {selectedBuilding && (
            <BuildingImageManager
              building={selectedBuilding}
              open={isImageManagerOpen}
              onOpenChange={setIsImageManagerOpen}
              onImagesUpdate={refetch}
            />
          )}
        </div>
      </LoadingOverlay>
    </ErrorBoundary>
  );
};

export default BuildingsManagement3;
