
import React from 'react';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

interface BuildingStoreGridLoadingProps {
  isSearching: boolean;
}

const BuildingStoreGridLoading: React.FC<BuildingStoreGridLoadingProps> = ({ isSearching }) => {
  const isMobile = useIsMobile();

  return (
    <div className={`space-y-${isMobile ? '4' : '6'}`}>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-4"
      >
        <div className="flex items-center justify-center space-x-2 text-[#3C1361]">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#3C1361]"></div>
          <span className={`font-medium ${isMobile ? 'text-base' : 'text-lg'}`}>
            {isSearching ? 'Buscando prédios...' : 'Carregando prédios...'}
          </span>
        </div>
      </motion.div>

      {/* Skeleton cards responsivos */}
      {[...Array(isMobile ? 3 : 4)].map((_, index) => (
        <motion.div 
          key={index} 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
        >
          {isMobile ? (
            // Skeleton mobile: Layout vertical
            <div className="flex flex-col">
              <div className="h-48 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 animate-pulse relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
              </div>
              <div className="p-4 space-y-3">
                <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg animate-pulse"></div>
                <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg animate-pulse w-3/4"></div>
                <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg animate-pulse w-1/2"></div>
                <div className="h-10 bg-gradient-to-r from-gray-200 to-gray-100 rounded-xl animate-pulse"></div>
              </div>
            </div>
          ) : (
            // Skeleton desktop: Layout horizontal
            <div className="flex flex-col lg:flex-row">
              <div className="lg:w-2/5 h-64 lg:h-80 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 animate-pulse relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
              </div>
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
          )}
        </motion.div>
      ))}
    </div>
  );
};

export default BuildingStoreGridLoading;
