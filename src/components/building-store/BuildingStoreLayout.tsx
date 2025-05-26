
import React from 'react';
import { BuildingStore } from '@/services/buildingStoreService';
import { BuildingFilters } from '@/hooks/useBuildingStore';
import BuildingSearchSection from './BuildingSearchSection';
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
  onViewPanels
}) => {
  return (
    <>
      {/* Search section with integrated filters */}
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
      
      {/* Single column building grid - full width */}
      <div className="w-full">
        <BuildingStoreGrid 
          buildings={buildings}
          isLoading={isLoading}
          isSearching={isSearching}
          onViewPanels={onViewPanels}
          selectedLocation={selectedLocation}
        />
      </div>
    </>
  );
};

export default BuildingStoreLayout;
