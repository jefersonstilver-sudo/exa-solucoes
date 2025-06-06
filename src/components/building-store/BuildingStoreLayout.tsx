
import React from 'react';
import { BuildingStore } from '@/services/buildingStoreService';
import { BuildingFilters } from '@/hooks/useBuildingStore';
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
  handleClearLocation
}) => {
  return (
    <div className="w-full">
      {/* Search section - Container sem limitações */}
      <div className="w-full">
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
      </div>
      
      {/* Layout with sidebar and building grid - Com container limitado */}
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6">
        <BuildingStoreGridLayout 
          buildings={buildings}
          isLoading={isLoading}
          isSearching={isSearching}
          selectedLocation={selectedLocation}
          filters={filters}
          handleFilterChange={handleFilterChange}
        />
      </div>
    </div>
  );
};

export default BuildingStoreLayout;
