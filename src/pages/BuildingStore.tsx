
import React from 'react';
import Layout from '@/components/layout/Layout';
import BuildingStoreLayout from '@/components/building-store/BuildingStoreLayout';
import BuildingStoreHeader from '@/components/building-store/BuildingStoreHeader';
import useBuildingStore from '@/hooks/useBuildingStore';
import { useCartManager } from '@/hooks/useCartManager';

const BuildingStore = () => {
  console.log('🏢 [BUILDING STORE] Página da loja carregada');

  const {
    buildings,
    isLoading,
    error,
    searchLocation,
    setSearchLocation,
    selectedLocation,
    isSearching,
    filters,
    handleFilterChange,
    handleSearch,
    handleClearLocation,
    initializeStore
  } = useBuildingStore();

  const { handleAddToCart } = useCartManager();

  // Initialize store on mount
  React.useEffect(() => {
    console.log('🚀 [BUILDING STORE] Inicializando store');
    initializeStore();
  }, [initializeStore]);

  // Log do estado atual
  React.useEffect(() => {
    console.log('🔄 [BUILDING STORE] === ESTADO ATUAL ===');
    console.log('🔄 [BUILDING STORE] buildings.length:', buildings.length);
    console.log('🔄 [BUILDING STORE] isLoading:', isLoading);
    console.log('🔄 [BUILDING STORE] error:', error);
    console.log('🔄 [BUILDING STORE] handleAddToCart function:', !!handleAddToCart);
  }, [buildings, isLoading, error, handleAddToCart]);

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen flex flex-col pt-20">
          <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
            <h2 className="text-2xl font-semibold text-red-500 mb-4">
              Erro ao carregar prédios
            </h2>
            <p className="text-muted-foreground mb-6">
              Ocorreu um problema ao buscar os prédios disponíveis.
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-[#3C1361] text-white rounded-md hover:bg-[#3C1361]/80"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Container principal com padding para evitar sobreposição do header */}
      <div className="min-h-screen w-full pt-20">
        <div className="w-full container mx-auto px-4 md:px-6 py-6">
          {/* Header sem título e subtítulo */}
          <BuildingStoreHeader />
          
          <BuildingStoreLayout 
            buildings={buildings}
            isLoading={isLoading}
            isSearching={isSearching}
            searchLocation={searchLocation}
            setSearchLocation={setSearchLocation}
            selectedLocation={selectedLocation}
            filters={filters}
            handleFilterChange={handleFilterChange}
            handleSearch={handleSearch}
            handleClearLocation={handleClearLocation}
            onAddToCart={handleAddToCart}
          />
        </div>
      </div>
    </Layout>
  );
};

export default BuildingStore;
