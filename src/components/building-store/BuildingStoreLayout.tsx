
import React, { useState, useEffect } from 'react';
import { BuildingStore } from '@/services/buildingStoreService';
import { BuildingFilters } from '@/hooks/useBuildingStore';
import BuildingStoreSearchSection from './layout/BuildingStoreSearchSection';
import BuildingStoreGridLayout from './layout/BuildingStoreGrid';
import MobileBuildingSheet from './MobileBuildingSheet';
import { AnimatePresence } from 'framer-motion';

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
  sortOption: string;
  setSortOption: (option: string) => void;
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
  sortOption,
  setSortOption
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingStore | null>(null);

  const handleSidebarToggle = () => {
    setSidebarCollapsed(prev => !prev);
  };

  // Listen for map pin clicks
  useEffect(() => {
    const handleShowBuildingCard = (event: CustomEvent) => {
      setSelectedBuilding(event.detail.building);
    };

    window.addEventListener('showMobileBuildingCard', handleShowBuildingCard as EventListener);
    
    return () => {
      window.removeEventListener('showMobileBuildingCard', handleShowBuildingCard as EventListener);
    };
  }, []);

  const handleCloseBuildingCard = () => {
    setSelectedBuilding(null);
  };
  return (
    <div className="w-full">
      {/* Search section - Full width grudado no header */}
      <div className="w-full -mx-4 md:-mx-6">
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
          sortOption={sortOption}
          setSortOption={setSortOption}
        />
      </div>
      
      {/* Layout with sidebar and building grid - Com container limitado e espaçamento pro search fixo */}
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 pt-6">
        <BuildingStoreGridLayout 
          buildings={buildings}
          isLoading={isLoading}
          isSearching={isSearching}
          selectedLocation={selectedLocation}
          filters={filters}
          handleFilterChange={handleFilterChange}
          sidebarCollapsed={sidebarCollapsed}
          onSidebarToggle={handleSidebarToggle}
          sortOption={sortOption}
          setSortOption={setSortOption}
        />
      </div>

      {/* Building Sheet for Pin Clicks */}
      <AnimatePresence>
        {selectedBuilding && (
          <MobileBuildingSheet 
            building={selectedBuilding}
            onClose={handleCloseBuildingCard}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default BuildingStoreLayout;
