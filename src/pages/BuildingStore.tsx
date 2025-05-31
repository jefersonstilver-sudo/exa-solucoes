
import React from 'react';
import Layout from '@/components/layout/Layout';
import BuildingStoreLayout from '@/components/building-store/BuildingStoreLayout';
import useBuildingStore from '@/hooks/useBuildingStore';
import { useCartManager } from '@/hooks/useCartManager';

const BuildingStore = () => {
  console.log('BuildingStore: Página da loja carregada');

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
    initializeStore();
  }, [initializeStore]);

  if (error) {
    return (
      <Layout>
        <div className="mobile-scroll-container">
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
      <div className="mobile-scroll-container">
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
    </Layout>
  );
};

export default BuildingStore;
