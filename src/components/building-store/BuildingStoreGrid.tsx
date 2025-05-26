
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Search } from 'lucide-react';
import { BuildingStore } from '@/services/buildingStoreService';
import { Panel } from '@/types/panel';
import BuildingStoreCard from './BuildingStoreCard';

interface BuildingStoreGridProps {
  buildings: BuildingStore[] | undefined;
  isLoading: boolean;
  isSearching: boolean;
  onAddToCart: (panel: Panel, duration?: number) => void;
  selectedLocation: { lat: number, lng: number } | null;
}

const BuildingStoreGrid: React.FC<BuildingStoreGridProps> = ({
  buildings,
  isLoading,
  isSearching,
  onAddToCart,
  selectedLocation
}) => {
  // LOGS DETALHADOS para debug
  console.log('🏢 [BUILDING STORE GRID] === RENDERIZANDO ===');
  console.log('🏢 [BUILDING STORE GRID] buildings:', buildings);
  console.log('🏢 [BUILDING STORE GRID] buildings?.length:', buildings?.length);
  console.log('🏢 [BUILDING STORE GRID] isLoading:', isLoading);
  console.log('🏢 [BUILDING STORE GRID] isSearching:', isSearching);
  console.log('🏢 [BUILDING STORE GRID] selectedLocation:', selectedLocation);

  // Loading skeleton
  if (isLoading || isSearching) {
    console.log('🔄 [BUILDING STORE GRID] Mostrando loading...');
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gray-200 h-80 rounded-xl"></div>
          </div>
        ))}
      </div>
    );
  }

  // CORREÇÃO CRÍTICA: Verificar se buildings é array válido e tem itens
  const buildingsArray = Array.isArray(buildings) ? buildings : [];
  const hasBuildings = buildingsArray.length > 0;
  
  console.log('🏢 [BUILDING STORE GRID] buildingsArray:', buildingsArray);
  console.log('🏢 [BUILDING STORE GRID] hasBuildings:', hasBuildings);

  // Só mostrar empty state se realmente não há prédios
  if (!hasBuildings) {
    console.log('❌ [BUILDING STORE GRID] Nenhum prédio disponível - mostrando empty state');
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16"
      >
        <div className="flex flex-col items-center space-y-4">
          <Building2 className="h-16 w-16 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-700">
            Nenhum prédio disponível
          </h3>
          <p className="text-gray-500 max-w-md">
            {selectedLocation 
              ? "Nenhum prédio encontrado nesta região. Tente expandir o raio de busca ou buscar em uma localização diferente."
              : "No momento não há prédios disponíveis em nossa rede. Tente novamente mais tarde."
            }
          </p>
        </div>
      </motion.div>
    );
  }

  // CORREÇÃO: Sempre mostrar prédios quando disponíveis
  console.log('✅ [BUILDING STORE GRID] Renderizando', buildingsArray.length, 'prédios');
  
  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {buildingsArray.map((building, index) => {
          console.log(`🏢 [BUILDING STORE GRID] Renderizando prédio ${index + 1}:`, building.nome);
          return (
            <motion.div
              key={building.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <BuildingStoreCard
                building={building}
                onAddToCart={onAddToCart}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default BuildingStoreGrid;
