
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import BuildingStoreLayout from '@/components/building-store/BuildingStoreLayout';
import BuildingStoreGrid from '@/components/building-store/BuildingStoreGrid';
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
    
    // Navegar para a página de painéis do prédio específico
    // Por enquanto, vamos navegar para uma página de painéis genérica
    // Depois podemos implementar uma página específica por prédio
    toast.success(`Carregando painéis do ${building.nome}...`);
    
    // Salvar o prédio selecionado no localStorage para usar na próxima página
    localStorage.setItem('selectedBuilding', JSON.stringify(building));
    
    // Navegar para página de painéis (pode ser implementada depois)
    navigate(`/paineis-digitais/predios/${building.id}/paineis`);
  };

  const handleFiltersChange = (newFilters: any) => {
    console.log('🔧 [BuildingStorePage] Alteração de filtros:', newFilters);
    updateFilters(newFilters);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <BuildingStoreLayout
          onLocationSearch={handleLocationSearch}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onResetFilters={resetFilters}
          selectedLocation={selectedLocation}
          isLoading={isLoading}
        >
          <BuildingStoreGrid
            buildings={buildings}
            isLoading={isLoading}
            isSearching={isSearching}
            onViewPanels={handleViewPanels}
            selectedLocation={selectedLocation}
          />
        </BuildingStoreLayout>
      </div>
    </Layout>
  );
};

export default BuildingStorePage;
