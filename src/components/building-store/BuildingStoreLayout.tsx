
import React from 'react';
import { motion } from 'framer-motion';
import { BuildingStore } from '@/services/buildingStoreService';
import { BuildingFilters } from '@/hooks/useBuildingStore';
import SearchSection from '@/components/panels/SearchSection';
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
      {/* Search section */}
      <SearchSection 
        searchLocation={searchLocation}
        setSearchLocation={setSearchLocation}
        selectedLocation={selectedLocation}
        isSearching={isSearching}
        handleSearch={handleSearch}
        handleClearLocation={handleClearLocation}
        filters={{
          radius: filters.radius,
          neighborhood: filters.neighborhood || '',
          status: [],
          buildingProfile: filters.standardProfile,
          facilities: filters.amenities,
          minMonthlyViews: 0,
          buildingAge: 'all',
          buildingType: 'all'
        }}
        handleFilterChange={(newFilters) => {
          handleFilterChange({
            radius: newFilters.radius || filters.radius,
            neighborhood: newFilters.neighborhood || filters.neighborhood,
            standardProfile: newFilters.buildingProfile || filters.standardProfile,
            amenities: newFilters.facilities || filters.amenities
          });
        }}
        panelsCount={buildings?.length || 0}
      />
      
      {/* Layout with sidebar and building grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative mt-8">
        {/* Left sidebar with filters */}
        <div className="lg:col-span-3 xl:col-span-3">
          <BuildingFilterSidebar 
            filters={filters}
            handleFilterChange={handleFilterChange}
            isLoading={isLoading}
            isSearching={isSearching}
          />
        </div>
        
        {/* Main content with building grid */}
        <div className="lg:col-span-9 xl:col-span-9">
          <BuildingStoreGrid 
            buildings={buildings}
            isLoading={isLoading}
            isSearching={isSearching}
            onViewPanels={onViewPanels}
            selectedLocation={selectedLocation}
          />
        </div>
      </div>
    </>
  );
};

export default BuildingStoreLayout;
