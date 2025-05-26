
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import BuildingStoreGrid from '@/components/building-store/BuildingStoreGrid';
import BuildingFilterSidebar from '@/components/building-store/BuildingFilterSidebar';
import { useBuildingStore } from '@/hooks/useBuildingStore';
import { BuildingStore } from '@/services/buildingStoreService';
import { toast } from 'sonner';

const BuildingStorePage = () => {
  const navigate = useNavigate();
  const {
    buildings,
    isLoading,
    isSearching,
    selectedLocation,
    filters,
    searchByLocation,
    updateFilters,
    resetFilters
  } = useBuildingStore();

  console.log('🏪 [BuildingStorePage] Estado atual:', {
    buildingsCount: buildings?.length || 0,
    isLoading,
    isSearching,
    hasLocation: !!selectedLocation,
    buildings: buildings
  });

  const handleLocationSearch = async (lat: number, lng: number) => {
    console.log('📍 [BuildingStorePage] Busca por localização:', { lat, lng });
    try {
      await searchByLocation(lat, lng);
    } catch (error) {
      console.error('❌ [BuildingStorePage] Erro na busca por localização:', error);
      toast.error('Erro ao buscar por localização');
    }
  };

  const handleViewPanels = (building: BuildingStore) => {
    console.log('👁️ [BuildingStorePage] Visualizar painéis do prédio:', building.nome);
    
    toast.success(`Carregando painéis do ${building.nome}...`);
    
    localStorage.setItem('selectedBuilding', JSON.stringify(building));
    
    navigate(`/paineis-digitais/predios/${building.id}/paineis`);
  };

  const handleFiltersChange = (newFilters: any) => {
    console.log('🔧 [BuildingStorePage] Alteração de filtros:', newFilters);
    updateFilters(newFilters);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 md:px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#3C1361] mb-2">
              Loja de Prédios
            </h1>
            <p className="text-gray-600">
              Selecione um prédio para visualizar os painéis disponíveis
            </p>
          </div>

          {/* Layout with sidebar and grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left sidebar with filters */}
            <div className="lg:col-span-3 xl:col-span-3">
              <BuildingFilterSidebar 
                filters={filters}
                handleFilterChange={handleFiltersChange}
                isLoading={isLoading}
                isSearching={isSearching}
              />
            </div>
            
            {/* Main content with building grid */}
            <div className="lg:col-span-9 xl:col-span-9">
              <BuildingStoreGrid
                buildings={buildings}
                isLoading={isLoading}
                isSearching={isSearching}
                onViewPanels={handleViewPanels}
                selectedLocation={selectedLocation}
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BuildingStorePage;
