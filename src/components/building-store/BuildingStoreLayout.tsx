
import React from 'react';
import { motion } from 'framer-motion';
import { BuildingStore } from '@/services/buildingStoreService';
import { BuildingFilters } from '@/hooks/useBuildingStore';
import { Panel } from '@/types/panel';
import BuildingSearchSection from './BuildingSearchSection';
import BuildingFilterSidebar from './BuildingFilterSidebar';
import BuildingStoreGrid from './BuildingStoreGrid';

interface BuildingStoreLayoutProps {
  buildings: BuildingStore[] | undefined;
  isLoading: boolean;
  isSearching: boolean;
  searchLocation: string;
  setSearchLocation: (location: string) => void;
  selectedLocation: { lat: number, lng: number } | null;
  filters: BuildingFilters;
  handleFilterChange: (newFilters: Partial<BuildingFilters>) => void;
  handleSearch: (location: string) => Promise<void>;
  handleClearLocation: () => void;
  onViewPanels: (building: BuildingStore) => void;
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
  onViewPanels,
  onAddToCart
}) => {
  return (
    <>
      {/* Search section */}
      <BuildingSearchSection 
        searchLocation={searchLocation}
        setSearchLocation={setSearchLocation}
        selectedLocation={selectedLocation}
        isSearching={isSearching}
        handleSearch={handleSearch}
        handleClearLocation={handleClearLocation}
        filters={filters}
        handleFilterChange={handleFilterChange}
        buildingsCount={buildings?.length || 0}
      />
      
      {/* Layout with sidebar and building grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative mt-8">
        {/* Left sidebar with filters - Reduced width */}
        <div className="lg:col-span-4 xl:col-span-3">
          <BuildingFilterSidebar 
            filters={filters}
            handleFilterChange={handleFilterChange}
            isLoading={isLoading}
            isSearching={isSearching}
          />
        </div>
        
        {/* Main content with building grid - Increased width */}
        <div className="lg:col-span-8 xl:col-span-9">
          <BuildingStoreGrid 
            buildings={buildings}
            isLoading={isLoading}
            isSearching={isSearching}
            onViewPanels={onViewPanels}
            onAddToCart={onAddToCart}
            selectedLocation={selectedLocation}
          />
        </div>
      </div>
    </>
  );
};

export default BuildingStoreLayout;
