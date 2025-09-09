
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import useBuildingStore from '@/hooks/useBuildingStore';
import BuildingStoreLayout from '@/components/building-store/BuildingStoreLayout';
import BuildingStoreHeader from '@/components/building-store/BuildingStoreHeader';

export default function PainelStore() {
  console.log('🏢 [PAINEL STORE] === INICIALIZANDO LOJA DE PRÉDIOS PROFISSIONAL ===');

  // Building store state usando seletores individuais otimizados
  const buildings = useBuildingStore(state => state.buildings);
  const isLoading = useBuildingStore(state => state.isLoading);
  const error = useBuildingStore(state => state.error);
  const searchLocation = useBuildingStore(state => state.searchLocation);
  const setSearchLocation = useBuildingStore(state => state.setSearchLocation);
  const selectedLocation = useBuildingStore(state => state.selectedLocation);
  const isSearching = useBuildingStore(state => state.isSearching);
  const filters = useBuildingStore(state => state.filters);
  const handleFilterChange = useBuildingStore(state => state.handleFilterChange);
  const handleSearch = useBuildingStore(state => state.handleSearch);
  const handleClearLocation = useBuildingStore(state => state.handleClearLocation);
  const initializeStore = useBuildingStore(state => state.initializeStore);
  const sortOption = useBuildingStore(state => state.sortOption);
  const setSortOption = useBuildingStore(state => state.setSortOption);

  // Initialize store on mount
  useEffect(() => {
    console.log('🚀 [PAINEL STORE] Inicializando store da loja profissional');
    initializeStore();
  }, [initializeStore]);

  // Log do estado atual
  useEffect(() => {
    console.log('🔄 [PAINEL STORE] === ESTADO ATUAL DA LOJA PROFISSIONAL ===');
    console.log('🔄 [PAINEL STORE] buildings.length:', buildings.length);
    console.log('🔄 [PAINEL STORE] isLoading:', isLoading);
    console.log('🔄 [PAINEL STORE] error:', error);
    console.log('🔄 [PAINEL STORE] searchLocation:', searchLocation);
    console.log('🔄 [PAINEL STORE] selectedLocation:', selectedLocation);
  }, [buildings, isLoading, error, searchLocation, selectedLocation]);

  if (error) {
    console.error('❌ [PAINEL STORE] Erro na loja profissional:', error);
    return (
      <Layout>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center"
        >
          <div className="bg-white rounded-2xl shadow-xl border border-red-100 p-8 max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-500 text-2xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-semibold text-red-500 mb-4">
              Erro ao carregar prédios
            </h2>
            <p className="text-muted-foreground mb-6">
              Ocorreu um problema ao buscar os prédios disponíveis. Nossa equipe está trabalhando para resolver.
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-3 bg-[#3C1361] text-white rounded-xl hover:bg-[#3C1361]/80 transition-all duration-300 font-medium"
            >
              Tentar novamente
            </button>
          </div>
        </motion.div>
      </Layout>
    );
  }

  return (
    <Layout>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 md:px-6 py-6 mobile-scroll-fix"
      >
        {/* Header da Loja com botão de refresh */}
        <BuildingStoreHeader />
        
        {/* Layout Profissional Completo */}
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
          sortOption={sortOption}
          setSortOption={setSortOption}
        />
      </motion.div>
    </Layout>
  );
}
