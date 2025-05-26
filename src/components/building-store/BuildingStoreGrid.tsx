
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

  // Empty state when no buildings found
  if (!buildings || buildings.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16"
      >
        <div className="flex flex-col items-center space-y-4">
          {selectedLocation ? (
            <>
              <Search className="h-16 w-16 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-700">
                Nenhum prédio encontrado nesta região
              </h3>
              <p className="text-gray-500 max-w-md">
                Tente expandir o raio de busca ou buscar em uma localização diferente.
              </p>
            </>
          ) : (
            <>
              <Building2 className="h-16 w-16 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-700">
                Busque prédios na sua região
              </h3>
              <p className="text-gray-500 max-w-md">
                Digite um endereço, bairro ou cidade para encontrar prédios disponíveis para publicidade.
              </p>
            </>
          )}
        </div>
      </motion.div>
    );
  }

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
