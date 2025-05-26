
import React from 'react';
import { BuildingStore } from '@/services/buildingStoreService';
import { BuildingFilters } from '@/hooks/useBuildingStore';
import { Panel } from '@/types/panel';
import BuildingFilterSidebar from '../BuildingFilterSidebar';
import BuildingStoreGrid from '../BuildingStoreGrid';

interface BuildingStoreGridLayoutProps {
  buildings: BuildingStore[] | undefined;
  isLoading: boolean;
  isSearching: boolean;
  selectedLocation: { lat: number, lng: number } | null;
  filters: BuildingFilters;
  handleFilterChange: (newFilters: Partial<BuildingFilters>) => void;
  onAddToCart: (panel: Panel, duration?: number) => void;
}

const BuildingStoreGridLayout: React.FC<BuildingStoreGridLayoutProps> = ({
  buildings,
  isLoading,
  isSearching,
  selectedLocation,
  filters,
  handleFilterChange,
  onAddToCart
}) => {
  return (
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
          onAddToCart={onAddToCart}
          selectedLocation={selectedLocation}
        />
      </div>
    </div>
  );
};

export default BuildingStoreGridLayout;
