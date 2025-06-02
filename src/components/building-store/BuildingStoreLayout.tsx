
import React from 'react';
import { BuildingStore } from '@/services/buildingStoreService';
import { BuildingFilters } from '@/hooks/useBuildingStore';
import { Panel } from '@/types/panel';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import BuildingSearchSection from './BuildingSearchSection';
import BuildingStoreGrid from './BuildingStoreGrid';
import BuildingStoreFilters from './BuildingStoreFilters';
import BuildingStoreStats from './BuildingStoreStats';

interface BuildingStoreLayoutProps {
  buildings: BuildingStore[];
  isLoading: boolean;
  isSearching: boolean;
  searchLocation: string;
  setSearchLocation: (location: string) => void;
  selectedLocation: { lat: number, lng: number } | null;
  filters: BuildingFilters;
  handleFilterChange: (filters: Partial<BuildingFilters>) => void;
  handleSearch: (location: string) => Promise<void>;
  handleClearLocation: () => void;
  onAddToCart: (panel: Panel, duration?: number) => void;
}

const BuildingStoreLayout: React.FC<BuildingStoreLayoutProps> = ({
  buildings,
  isLoading,
  isSearching,
  searchLocation,
  setSearchLocation,
  selectedLocation,
  filters,
  handleFilterChange,
  handleSearch,
  handleClearLocation,
  onAddToCart
}) => {
  const isMobile = useIsMobile();

  console.log('🏗️ [BUILDING STORE LAYOUT] Renderizando layout');
  console.log('🏗️ [BUILDING STORE LAYOUT] Buildings count:', buildings.length);
  console.log('🏗️ [BUILDING STORE LAYOUT] isLoading:', isLoading);
  console.log('🏗️ [BUILDING STORE LAYOUT] Filters:', filters);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Search Section - Always visible */}
      <BuildingSearchSection
        searchLocation={searchLocation}
        setSearchLocation={setSearchLocation}
        selectedLocation={selectedLocation}
        isSearching={isSearching}
        handleSearch={handleSearch}
        handleClearLocation={handleClearLocation}
        filters={filters}
        handleFilterChange={handleFilterChange}
        buildingsCount={buildings.length}
      />

      {/* Main Content Container */}
      <div className={`w-full ${isMobile ? 'px-4 py-6' : 'px-6 py-8'}`}>
        <div className="w-full max-w-7xl mx-auto">
          
          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <BuildingStoreStats 
              totalBuildings={buildings.length}
              isLoading={isLoading}
              selectedLocation={selectedLocation}
              filters={filters}
            />
          </motion.div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Filters Sidebar - Desktop only */}
            {!isMobile && (
              <div className="lg:col-span-3">
                <div className="sticky top-24">
                  <BuildingStoreFilters
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    isLoading={isLoading}
                    buildingsCount={buildings.length}
                  />
                </div>
              </div>
            )}

            {/* Buildings Grid */}
            <div className={isMobile ? 'col-span-1' : 'lg:col-span-9'}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <BuildingStoreGrid
                  buildings={buildings}
                  isLoading={isLoading}
                  isSearching={isSearching}
                  onAddToCart={onAddToCart}
                  selectedLocation={selectedLocation}
                />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuildingStoreLayout;
