
import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useAdminBuildingsData } from '@/hooks/useAdminBuildingsData';
import { useBuildingActions } from '@/hooks/useBuildingActions';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import BuildingHeader from '@/components/admin/buildings/BuildingHeader';
import AdminBuildingStatsCards from '@/components/admin/buildings/AdminBuildingStatsCards';
import BuildingsFilterSection from '@/components/admin/buildings/BuildingsFilterSection';
import AdminBuildingsList from '@/components/admin/buildings/AdminBuildingsList';
import BuildingsDialogSection from '@/components/admin/buildings/BuildingsDialogSection';

const BuildingsManagement = () => {
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

  console.log('🏢 [ADMIN BUILDINGS MANAGEMENT] Estado atual:', {
    totalBuildings: buildings.length,
    activeBuildings: buildings.filter(b => b.status === 'ativo').length,
    inactiveBuildings: buildings.filter(b => b.status === 'inativo').length,
    selectedBuilding: selectedBuilding?.nome || 'Nenhum',
    isDetailsOpen,
    isFormOpen
  });

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
        <RefreshCw className="h-8 w-8 animate-spin text-indexa-purple" />
        <span className="ml-2 text-indexa-purple">Carregando sistema administrativo completo...</span>
      </div>
    );
  }

  return (
    <ErrorBoundary
      onError={(error) => {
        console.error('🚨 [ADMIN BUILDINGS MANAGEMENT] Erro crítico:', error);
      }}
    >
      <LoadingOverlay isLoading={operationLoading} message="Processando operação...">
        <div className="space-y-6 pb-8">
          <BuildingHeader
            loading={loading}
            onRefresh={refetch}
            onNewBuilding={handleNewBuilding}
          />

          <AdminBuildingStatsCards stats={stats} />

          <BuildingsFilterSection
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filters={filters}
            onFiltersChange={setFilters}
            buildings={buildings}
          />

          <AdminBuildingsList
            buildings={filteredBuildings}
            onView={handleViewBuilding}
            onEdit={handleEditBuilding}
            onImageManager={handleImageManager}
            onDelete={handleDeleteBuilding}
            onViewCampaigns={handleViewCampaigns}
          />

          <BuildingsDialogSection
            isFormOpen={isFormOpen}
            setIsFormOpen={setIsFormOpen}
            selectedBuilding={selectedBuilding}
            onSuccess={handleSuccess}
            isDetailsOpen={isDetailsOpen}
            onCloseDetails={handleCloseDetails}
            isImageManagerOpen={isImageManagerOpen}
            setIsImageManagerOpen={setIsImageManagerOpen}
            refetch={refetch}
          />
        </div>
      </LoadingOverlay>
    </ErrorBoundary>
  );
};

export default BuildingsManagement;
