import React, { useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useAdminBuildingsData } from '@/hooks/useAdminBuildingsData';
import { useBuildingActions } from '@/hooks/useBuildingActions';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import BuildingsHeader3 from '@/components/admin/buildings/v3/BuildingsHeader3';
import BuildingsFilters3, {
  DEFAULT_BUILDINGS_FILTERS,
  type BuildingsFiltersState,
  type SortKey,
} from '@/components/admin/buildings/v3/BuildingsFilters3';
import BuildingsList3 from '@/components/admin/buildings/v3/BuildingsList3';
import BuildingFormDialog3 from '@/components/admin/buildings/v3/BuildingFormDialog3';
import BuildingDetailsDialog from '@/components/admin/buildings/BuildingDetailsDialog';
import BuildingImageManager from '@/components/admin/buildings/BuildingImageManager';

const BuildingsManagement3 = () => {
  const { buildings, stats, loading, refetch, deleteBuilding } = useAdminBuildingsData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<BuildingsFiltersState>(DEFAULT_BUILDINGS_FILTERS);
  const [sortBy, setSortBy] = useState<SortKey>('updated_desc');

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
    handleCloseDetails,
  } = useBuildingActions(deleteBuilding, refetch);

  const filteredAndSorted = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const list = buildings.filter((b: any) => {
      const matchesSearch =
        !term ||
        (b.nome || '').toLowerCase().includes(term) ||
        (b.endereco || '').toLowerCase().includes(term) ||
        (b.bairro || '').toLowerCase().includes(term);

      const matchesStatus = filters.status === 'all' || b.status === filters.status;

      const matchesAirbnb =
        filters.airbnb === 'all' ||
        (filters.airbnb === 'with' && Boolean(b.tem_airbnb)) ||
        (filters.airbnb === 'without' && !b.tem_airbnb);

      const matchesPadrao =
        filters.padrao_publico === 'all' || b.padrao_publico === filters.padrao_publico;

      const matchesPaineis =
        filters.paineis === 'all' ||
        (filters.paineis === 'with' && (b.paineis_ativos || 0) > 0) ||
        (filters.paineis === 'without' && (b.paineis_ativos || 0) === 0);

      const matchesDevice =
        filters.device === 'all' ||
        (filters.device === 'online' && b.device_status === 'online') ||
        (filters.device === 'offline' && b.device_status === 'offline') ||
        (filters.device === 'none' && (!b.device_status || b.device_status === 'not_connected'));

      return (
        matchesSearch &&
        matchesStatus &&
        matchesAirbnb &&
        matchesPadrao &&
        matchesPaineis &&
        matchesDevice
      );
    });

    const sorted = [...list];
    sorted.sort((a: any, b: any) => {
      switch (sortBy) {
        case 'name_asc':
          return (a.nome || '').localeCompare(b.nome || '', 'pt-BR');
        case 'audience_desc':
          return (b.publico_estimado || 0) - (a.publico_estimado || 0);
        case 'panels_desc':
          return (b.paineis_ativos || 0) - (a.paineis_ativos || 0);
        case 'created_desc':
          return (
            new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
          );
        case 'updated_desc':
        default: {
          const aTime = new Date(a.local_updated_at || a.created_at || 0).getTime();
          const bTime = new Date(b.local_updated_at || b.created_at || 0).getTime();
          return bTime - aTime;
        }
      }
    });
    return sorted;
  }, [buildings, searchTerm, filters, sortBy]);

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
            sortBy={sortBy}
            onSortChange={setSortBy}
            buildings={buildings}
          />

          <BuildingsList3
            buildings={filteredAndSorted}
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
