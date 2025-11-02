
import React from 'react';
import { BuildingStore } from '@/services/buildingStoreService';
import { BuildingFilters } from '@/hooks/useBuildingStore';
import { useIsMobile } from '@/hooks/use-mobile';
import BuildingFilterSidebar from '../BuildingFilterSidebar';
import BuildingStoreGrid from '../BuildingStoreGrid';
import MobileBuildingFilters from '../MobileBuildingFilters';
import BuildingStoreResultsHeader from '../BuildingStoreResultsHeader';

interface BuildingStoreGridLayoutProps {
  buildings: BuildingStore[] | undefined;
  isLoading: boolean;
  isSearching: boolean;
  selectedLocation: { lat: number, lng: number } | null;
  filters: BuildingFilters;
  handleFilterChange: (newFilters: Partial<BuildingFilters>) => void;
  sidebarCollapsed?: boolean;
  onSidebarToggle?: () => void;
  sortOption: string;
  setSortOption: (option: string) => void;
}

const BuildingStoreGridLayout: React.FC<BuildingStoreGridLayoutProps> = ({
  buildings,
  isLoading,
  isSearching,
  selectedLocation,
  filters,
  handleFilterChange,
  sidebarCollapsed = false,
  onSidebarToggle,
  sortOption,
  setSortOption
}) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    // Layout mobile: Stack vertical com barra de controle única no topo
    return (
      <div className="w-full pb-6">
        {/* Barra de controle única - sticky no topo */}
        <div className="sticky top-0 z-20 bg-white shadow-md border-b border-gray-200">
          <MobileBuildingFilters 
            filters={filters}
            handleFilterChange={handleFilterChange}
            isLoading={isLoading}
            isSearching={isSearching}
            buildingsCount={buildings?.length || 0}
            sortOption={sortOption}
            setSortOption={setSortOption}
            hasLocationSearch={!!selectedLocation}
          />
        </div>
        
        {/* Grid de prédios mobile - sem header duplicado */}
        <div className="w-full px-3 pt-4">
          <BuildingStoreGrid 
            buildings={buildings}
            isLoading={isLoading}
            isSearching={isSearching}
            selectedLocation={selectedLocation}
          />
        </div>
      </div>
    );
  }

  // Layout desktop: Grid com sidebar lateral - NOVO LAYOUT 2 COLUNAS
  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
      {/* Left sidebar with filters - Desktop only */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:col-span-1' : 'lg:col-span-3'}`}>
        <div className="sticky top-4">
          <BuildingFilterSidebar 
            filters={filters}
            handleFilterChange={handleFilterChange}
            isLoading={isLoading}
            isSearching={isSearching}
            isCollapsed={sidebarCollapsed}
            onToggle={onSidebarToggle}
          />
        </div>
      </div>
      
      {/* Main content with building grid - 2 COLUNAS PROFISSIONAL */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:col-span-11' : 'lg:col-span-9'}`}>
        <BuildingStoreResultsHeader 
          isLoading={isLoading}
          isSearching={isSearching}
          buildingsCount={buildings?.length || 0}
          onSortChange={(value) => { setSortOption(value); }}
          sortOption={sortOption}
          hasLocationSearch={!!selectedLocation}
        />
        <BuildingStoreGrid 
          buildings={buildings}
          isLoading={isLoading}
          isSearching={isSearching}
          selectedLocation={selectedLocation}
          compactMode={true}
        />
      </div>
    </div>
  );
};

export default BuildingStoreGridLayout;
