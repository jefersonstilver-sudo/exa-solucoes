
import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useBuildingsData } from '@/hooks/useBuildingsData';
import BuildingFormDialog from '@/components/admin/buildings/BuildingFormDialog';
import BuildingDetailsDialog from '@/components/admin/buildings/BuildingDetailsDialog';
import BuildingImageManager from '@/components/admin/buildings/BuildingImageManager';
import BuildingFilters from '@/components/admin/buildings/BuildingFilters';
import BuildingHeader from '@/components/admin/buildings/BuildingHeader';
import BuildingStatsCards from '@/components/admin/buildings/BuildingStatsCards';
import BuildingSearchSection from '@/components/admin/buildings/BuildingSearchSection';
import BuildingsList from '@/components/admin/buildings/BuildingsList';

const BuildingsManagement = () => {
  const { buildings, stats, loading, refetch, deleteBuilding } = useBuildingsData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isImageManagerOpen, setIsImageManagerOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    bairro: 'all',
    padrao_publico: 'all'
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

  const handleDeleteBuilding = async (building: any) => {
    if (window.confirm(`Tem certeza que deseja excluir o prédio "${building.nome}"? Esta ação não pode ser desfeita.`)) {
      await deleteBuilding(building.id);
    }
  };

  const handleNewBuilding = () => {
    setSelectedBuilding(null);
    setIsFormOpen(true);
  };

  const handleSuccess = () => {
    setIsFormOpen(false);
    setSelectedBuilding(null);
    refetch();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-indexa-purple" />
        <span className="ml-2 text-indexa-purple">Carregando sistema completo...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <BuildingHeader
        loading={loading}
        onRefresh={refetch}
        onNewBuilding={handleNewBuilding}
      />

      <BuildingStatsCards stats={stats} />

      <BuildingFilters 
        filters={filters} 
        onFiltersChange={setFilters}
        buildings={buildings}
      />

      <BuildingSearchSection
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <BuildingsList
        buildings={filteredBuildings}
        onView={(building) => {
          setSelectedBuilding(building);
          setIsDetailsOpen(true);
        }}
        onEdit={(building) => {
          setSelectedBuilding(building);
          setIsFormOpen(true);
        }}
        onImageManager={(building) => {
          setSelectedBuilding(building);
          setIsImageManagerOpen(true);
        }}
        onDelete={handleDeleteBuilding}
      />

      <BuildingFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        building={selectedBuilding}
        onSuccess={handleSuccess}
      />

      <BuildingDetailsDialog
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        building={selectedBuilding}
      />

      <BuildingImageManager
        open={isImageManagerOpen}
        onOpenChange={setIsImageManagerOpen}
        building={selectedBuilding}
        onImagesUpdate={refetch}
      />
    </div>
  );
};

export default BuildingsManagement;
