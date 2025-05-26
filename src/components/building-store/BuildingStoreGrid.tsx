
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
  // Loading skeleton
  if (isLoading || isSearching) {
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

  // CORREÇÃO: Mostrar prédios se existirem, independente da localização
  if (!buildings || buildings.length === 0) {
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
  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {buildings.map((building, index) => (
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
        ))}
      </AnimatePresence>
    </div>
  );
};

export default BuildingStoreGrid;
