
import React from 'react';
import { motion } from 'framer-motion';
import { Building2, MapPin, Filter } from 'lucide-react';
import { BuildingFilters } from '@/hooks/useBuildingStore';

interface BuildingStoreStatsProps {
  totalBuildings: number;
  isLoading: boolean;
  selectedLocation: { lat: number, lng: number } | null;
  filters: BuildingFilters;
}

const BuildingStoreStats: React.FC<BuildingStoreStatsProps> = ({
  totalBuildings,
  isLoading,
  selectedLocation,
  filters
}) => {
  
  const hasActiveFilters = (
    filters.neighborhood.trim() !== '' ||
    filters.venueType.length > 0 ||
    filters.priceRange[0] > 0 || 
    filters.priceRange[1] < 10000 ||
    filters.audienceMin > 0 ||
    filters.standardProfile.length > 0 ||
    filters.amenities.length > 0
  );

  return (
    <div className="flex flex-wrap gap-4 items-center justify-between">
      
      {/* Results Count */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex items-center bg-white rounded-lg px-4 py-2 shadow-sm border"
      >
        <Building2 className="h-5 w-5 text-[#3C1361] mr-2" />
        <span className="text-sm font-medium text-gray-700">
          {isLoading ? (
            'Carregando...'
          ) : (
            `${totalBuildings} prédio${totalBuildings !== 1 ? 's' : ''} disponível${totalBuildings !== 1 ? 'eis' : ''}`
          )}
        </span>
      </motion.div>

      {/* Location Indicator */}
      {selectedLocation && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex items-center bg-green-50 rounded-lg px-4 py-2 border border-green-200"
        >
          <MapPin className="h-4 w-4 text-green-600 mr-2" />
          <span className="text-sm font-medium text-green-700">
            Localização selecionada
          </span>
        </motion.div>
      )}

      {/* Filters Indicator */}
      {hasActiveFilters && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="flex items-center bg-blue-50 rounded-lg px-4 py-2 border border-blue-200"
        >
          <Filter className="h-4 w-4 text-blue-600 mr-2" />
          <span className="text-sm font-medium text-blue-700">
            Filtros aplicados
          </span>
        </motion.div>
      )}
    </div>
  );
};

export default BuildingStoreStats;
