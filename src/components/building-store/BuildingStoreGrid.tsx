import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, MapPin, Sparkles } from 'lucide-react';
import { BuildingStore } from '@/services/buildingStoreService';
import { useIsMobile } from '@/hooks/use-mobile';
import BuildingStoreCard from './BuildingStoreCard';
interface BuildingStoreGridProps {
  buildings: BuildingStore[] | undefined;
  isLoading: boolean;
  isSearching: boolean;
  selectedLocation: {
    lat: number;
    lng: number;
  } | null;
  compactMode?: boolean;
}
const BuildingStoreGrid: React.FC<BuildingStoreGridProps> = ({
  buildings,
  isLoading,
  isSearching,
  selectedLocation,
  compactMode = false
}) => {
  const isMobile = useIsMobile();
  console.log('🏢 [BUILDING STORE GRID] === RENDERIZANDO GRID ===');
  console.log('🏢 [BUILDING STORE GRID] buildings?.length:', buildings?.length);
  console.log('🏢 [BUILDING STORE GRID] isMobile:', isMobile);

  // Loading state com skeleton responsivo em grid
  if (isLoading || isSearching) {
    console.log('🔄 [BUILDING STORE GRID] Mostrando loading state...');
    return (
      <div>
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="text-center py-4 mb-6"
        >
          <div className="flex items-center justify-center space-x-2 text-[#9C1E1E]">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#9C1E1E]"></div>
          </div>
        </motion.div>

        {/* Skeleton cards em grid de 2 colunas */}
        <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-6`}>
          {[...Array(isMobile ? 3 : 4)].map((_, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
            >
              {/* Skeleton vertical compacto */}
              <div className="flex flex-col">
                <div className="h-48 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 animate-pulse relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                </div>
                <div className="p-4 space-y-3">
                  <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg animate-pulse"></div>
                  <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg animate-pulse w-3/4"></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg animate-pulse"></div>
                    <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg animate-pulse"></div>
                  </div>
                  <div className="h-10 bg-gradient-to-r from-gray-200 to-gray-100 rounded-xl animate-pulse"></div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state responsivo
  if (!buildings || buildings.length === 0) {
    console.log('❌ [BUILDING STORE GRID] Nenhum prédio encontrado');
    return <motion.div initial={{
      opacity: 0,
      scale: 0.95
    }} animate={{
      opacity: 1,
      scale: 1
    }} transition={{
      duration: 0.5
    }} className={`text-center ${isMobile ? 'py-8' : 'py-16'}`}>
        <div className={`bg-white rounded-3xl shadow-xl border border-gray-100 max-w-2xl mx-auto ${isMobile ? 'p-6 mx-4' : 'p-12'}`}>
          <motion.div initial={{
          scale: 0
        }} animate={{
          scale: 1
        }} transition={{
          delay: 0.2,
          type: "spring",
          stiffness: 200
        }} className={`bg-gradient-to-br from-[#9C1E1E]/10 to-[#D72638]/10 rounded-full flex items-center justify-center mx-auto mb-6 ${isMobile ? 'w-16 h-16' : 'w-24 h-24'}`}>
            <Building2 className={`text-[#9C1E1E] ${isMobile ? 'h-8 w-8' : 'h-12 w-12'}`} />
          </motion.div>
          
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.3
        }}>
            <h3 className={`font-bold text-gray-900 mb-4 ${isMobile ? 'text-xl' : 'text-2xl'}`}>
              {selectedLocation ? 'Nenhum prédio encontrado' : 'Nenhum prédio disponível'}
            </h3>
            <p className={`text-gray-600 leading-relaxed max-w-lg mx-auto ${isMobile ? 'text-sm' : 'text-lg'}`}>
              {selectedLocation ? 'Tente expandir a área de busca ou explorar outras regiões.' : 'Nossa equipe está trabalhando para adicionar mais locais estratégicos.'}
            </p>
          </motion.div>

          {selectedLocation && <motion.div initial={{
          opacity: 0,
          y: 10
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.4
        }} className={`mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl ${isMobile ? 'text-sm' : ''}`}>
              <div className="flex items-center justify-center">
                <MapPin className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-blue-800 font-medium">
                  Buscando próximo à sua localização
                </span>
              </div>
            </motion.div>}
        </div>
      </motion.div>;
  }
  console.log('✅ [BUILDING STORE GRID] EXIBINDO', buildings.length, 'prédios');
  
  return (
    <div>
      {/* Status da busca se houver localização selecionada */}
      {selectedLocation && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl ${isMobile ? 'p-3 mb-4' : 'p-4 mb-6'}`}
        >
          <div className="flex items-center">
            <Sparkles className="h-5 w-5 text-green-600 mr-3" />
            <span className={`text-green-800 font-medium ${isMobile ? 'text-sm' : ''}`}>
              Exibindo {buildings.length} prédio{buildings.length !== 1 ? 's' : ''} próximo{buildings.length !== 1 ? 's' : ''} à sua busca
            </span>
          </div>
        </motion.div>
      )}

      {/* Grid de prédios em 2 colunas - Layout E-commerce profissional */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-6`}
      >
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
                  delay: index * 0.05,
                  type: "spring",
                  stiffness: 100,
                  damping: 15
                }}
                whileHover={!isMobile ? {
                  y: -8,
                  transition: {
                    duration: 0.2,
                    type: "spring",
                    stiffness: 400
                  }
                } : {}}
                className="group"
              >
                <BuildingStoreCard building={building} compactMode={compactMode && !isMobile} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
export default BuildingStoreGrid;