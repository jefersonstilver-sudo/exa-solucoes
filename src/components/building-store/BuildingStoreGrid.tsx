
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, MapPin, Sparkles } from 'lucide-react';
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
  console.log('🏢 [BUILDING STORE GRID] === RENDERIZANDO GRID PROFISSIONAL ===');
  console.log('🏢 [BUILDING STORE GRID] buildings?.length:', buildings?.length);
  console.log('🏢 [BUILDING STORE GRID] isLoading:', isLoading);
  console.log('🏢 [BUILDING STORE GRID] isSearching:', isSearching);

  // Loading state com skeleton elegante
  if (isLoading || isSearching) {
    console.log('🔄 [BUILDING STORE GRID] Mostrando loading state elegante...');
    return (
      <div className="space-y-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-4"
        >
          <div className="flex items-center justify-center space-x-2 text-[#3C1361]">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#3C1361]"></div>
            <span className="text-lg font-medium">
              {isSearching ? 'Buscando prédios próximos...' : 'Carregando prédios...'}
            </span>
          </div>
        </motion.div>

        {/* Skeleton cards com animação elegante */}
        {[...Array(4)].map((_, index) => (
          <motion.div 
            key={index} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
          >
            <div className="flex flex-col lg:flex-row">
              {/* Skeleton image */}
              <div className="lg:w-2/5 h-64 lg:h-80 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 animate-pulse relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
              </div>
              
              {/* Skeleton content */}
              <div className="lg:w-3/5 p-6 space-y-4">
                <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg animate-pulse"></div>
                <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg animate-pulse w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg animate-pulse w-1/2"></div>
                  <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg animate-pulse w-2/3"></div>
                </div>
                <div className="flex space-x-2">
                  <div className="h-6 w-16 bg-gradient-to-r from-gray-200 to-gray-100 rounded-full animate-pulse"></div>
                  <div className="h-6 w-20 bg-gradient-to-r from-gray-200 to-gray-100 rounded-full animate-pulse"></div>
                </div>
                <div className="flex justify-between items-center pt-4">
                  <div className="h-8 w-24 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg animate-pulse"></div>
                  <div className="h-10 w-32 bg-gradient-to-r from-gray-200 to-gray-100 rounded-xl animate-pulse"></div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  // Empty state elegante
  if (!buildings || buildings.length === 0) {
    console.log('❌ [BUILDING STORE GRID] Nenhum prédio - mostrando empty state elegante');
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center py-16"
      >
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-12 max-w-2xl mx-auto">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 bg-gradient-to-br from-[#3C1361]/10 to-[#4A1B6B]/10 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Building2 className="h-12 w-12 text-[#3C1361]" />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {selectedLocation ? 'Nenhum prédio encontrado nesta região' : 'Nenhum prédio disponível'}
            </h3>
            <p className="text-gray-600 text-lg leading-relaxed max-w-lg mx-auto">
              {selectedLocation 
                ? 'Tente expandir a área de busca ou explorar outras regiões da cidade.'
                : 'Nossa equipe está trabalhando para adicionar mais locais estratégicos em nossa rede.'
              }
            </p>
          </motion.div>

          {selectedLocation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl"
            >
              <div className="flex items-center justify-center">
                <MapPin className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-blue-800 font-medium">
                  Buscando próximo à sua localização
                </span>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    );
  }

  console.log('✅ [BUILDING STORE GRID] EXIBINDO', buildings.length, 'prédios com animações');
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Status da busca se houver localização selecionada */}
      {selectedLocation && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4"
        >
          <div className="flex items-center">
            <Sparkles className="h-5 w-5 text-green-600 mr-3" />
            <span className="text-green-800 font-medium">
              Exibindo {buildings.length} prédio{buildings.length !== 1 ? 's' : ''} próximo{buildings.length !== 1 ? 's' : ''} à sua busca
            </span>
          </div>
        </motion.div>
      )}

      {/* Grid de prédios com animações escalonadas */}
      <AnimatePresence mode="popLayout">
        {buildings.map((building, index) => {
          console.log(`🏢 [BUILDING STORE GRID] Renderizando prédio ${index + 1}: ${building.nome}`);
          
          return (
            <motion.div
              key={building.id}
              layout
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.95 }}
              transition={{ 
                duration: 0.5, 
                delay: index * 0.1,
                type: "spring",
                stiffness: 100,
                damping: 15
              }}
              whileHover={{ 
                y: -8,
                transition: { duration: 0.2, type: "spring", stiffness: 400 }
              }}
              className="group"
            >
              <BuildingStoreCard
                building={building}
                onAddToCart={onAddToCart}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
};

export default BuildingStoreGrid;
