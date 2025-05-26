
import React from 'react';
import { BuildingStore } from '@/services/buildingStoreService';
import { BuildingFilters } from '@/hooks/useBuildingStore';
import { Panel } from '@/types/panel';
import BuildingStoreSearchSection from './layout/BuildingStoreSearchSection';
import BuildingStoreGridLayout from './layout/BuildingStoreGrid';

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
  return (
    <>
      {/* Search section */}
      <BuildingStoreSearchSection 
        searchLocation={searchLocation}
        setSearchLocation={setSearchLocation}
        selectedLocation={selectedLocation}
        isSearching={isSearching}
        filters={filters}
        handleFilterChange={handleFilterChange}
        handleSearch={handleSearch}
        handleClearLocation={handleClearLocation}
        buildings={buildings}
      />
      
      {/* Layout with sidebar and building grid */}
      <BuildingStoreGridLayout 
        buildings={buildings}
        isLoading={isLoading}
        isSearching={isSearching}
        selectedLocation={selectedLocation}
        filters={filters}
        handleFilterChange={handleFilterChange}
        onAddToCart={onAddToCart}
      />
    </>
  );
};

export default BuildingStoreLayout;
