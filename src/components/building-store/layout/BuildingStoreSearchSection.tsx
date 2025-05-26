
import React from 'react';
import { BuildingStore } from '@/services/buildingStoreService';
import { BuildingFilters } from '@/hooks/useBuildingStore';
import BuildingSearchSection from '../BuildingSearchSection';

interface BuildingStoreSearchSectionProps {
  searchLocation: string;
  setSearchLocation: (location: string) => void;
  selectedLocation: { lat: number, lng: number } | null;
  isSearching: boolean;
  filters: BuildingFilters;
  handleFilterChange: (newFilters: Partial<BuildingFilters>) => void;
  handleSearch: (location: string) => Promise<void>;
  handleClearLocation: () => void;
  buildings: BuildingStore[] | undefined;
}

const BuildingStoreSearchSection: React.FC<BuildingStoreSearchSectionProps> = ({
  searchLocation,
  setSearchLocation,
  selectedLocation,
  isSearching,
  filters,
  handleFilterChange,
  handleSearch,
  handleClearLocation,
  buildings
}) => {
  return (
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
  );
};

export default BuildingStoreSearchSection;
