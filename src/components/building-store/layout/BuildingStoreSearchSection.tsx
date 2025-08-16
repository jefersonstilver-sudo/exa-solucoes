
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

const BuildingStoreSearchSection: React.FC<BuildingStoreSearchSectionProps> = React.memo(({
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
  const memoizedHandleSearch = React.useCallback(handleSearch, [handleSearch]);
  const memoizedHandleClearLocation = React.useCallback(handleClearLocation, [handleClearLocation]);
  const memoizedSetSearchLocation = React.useCallback(setSearchLocation, [setSearchLocation]);
  const memoizedHandleFilterChange = React.useCallback(handleFilterChange, [handleFilterChange]);

  return (
    <BuildingSearchSection 
      searchLocation={searchLocation}
      setSearchLocation={memoizedSetSearchLocation}
      selectedLocation={selectedLocation}
      isSearching={isSearching}
      handleSearch={memoizedHandleSearch}
      handleClearLocation={memoizedHandleClearLocation}
      filters={filters}
      handleFilterChange={memoizedHandleFilterChange}
      buildingsCount={buildings?.length || 0}
    />
  );
});

export default BuildingStoreSearchSection;
