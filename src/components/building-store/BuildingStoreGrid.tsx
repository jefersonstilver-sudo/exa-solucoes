
import React from 'react';
import { motion } from 'framer-motion';
import { BuildingStore } from '@/services/buildingStoreService';
import CleanBuildingCard from './card/CleanBuildingCard';
import { useIsMobile } from '@/hooks/use-mobile';

interface BuildingStoreGridProps {
  buildings: BuildingStore[];
  isLoading: boolean;
  onAddToCart: (panel: any, duration?: number) => void;
}

const BuildingStoreGrid: React.FC<BuildingStoreGridProps> = ({
  buildings,
  isLoading,
  onAddToCart
}) => {
  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-96 bg-gray-200 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (buildings.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 max-w-md mx-auto">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-gray-400 text-2xl">🏢</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Nenhum prédio encontrado
          </h3>
          <p className="text-gray-600">
            Ajuste os filtros ou tente uma busca diferente.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className={`grid gap-6 ${
      isMobile 
        ? 'grid-cols-1' 
        : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
    }`}>
      {buildings.map((building, index) => (
        <motion.div
          key={building.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <CleanBuildingCard
            building={building}
            onAddToCart={onAddToCart}
          />
        </motion.div>
      ))}
    </div>
  );
};

export default BuildingStoreGrid;
