
import React from 'react';
import { BuildingStore } from '@/services/buildingStoreService';
import { BuildingFilters } from '@/hooks/building-store/types';
import { Panel } from '@/types/panel';
import { useIsMobile } from '@/hooks/use-mobile';
import BuildingFilterSidebar from '../BuildingFilterSidebar';
import BuildingStoreGrid from '../BuildingStoreGrid';
import MobileBuildingFilters from '../MobileBuildingFilters';

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
  const isMobile = useIsMobile();

  if (isMobile) {
    // Layout mobile: Stack vertical com filtros em drawer
    return (
      <div className="w-full space-y-4">
        {/* Filtros mobile */}
        <div className="w-full">
          <MobileBuildingFilters 
            filters={filters}
            handleFilterChange={handleFilterChange}
            isLoading={isLoading}
            isSearching={isSearching}
            buildingsCount={buildings?.length || 0}
          />
        </div>
        
        {/* Grid de prédios mobile */}
        <div className="w-full">
          <BuildingStoreGrid 
            buildings={buildings || []}
            isLoading={isLoading}
            onAddToCart={onAddToCart}
          />
        </div>
      </div>
    );
  }

  // Layout desktop: Grid com sidebar lateral
  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
      {/* Left sidebar with filters - Desktop only */}
      <div className="lg:col-span-4 xl:col-span-3">
        <div className="sticky top-4">
          <BuildingFilterSidebar 
            filters={filters}
            handleFilterChange={handleFilterChange}
            isLoading={isLoading}
            isSearching={isSearching}
          />
        </div>
      </div>
      
      {/* Main content with building grid */}
      <div className="lg:col-span-8 xl:col-span-9">
        <BuildingStoreGrid 
          buildings={buildings || []}
          isLoading={isLoading}
          onAddToCart={onAddToCart}
        />
      </div>
    </div>
  );
};

export default BuildingStoreGridLayout;
