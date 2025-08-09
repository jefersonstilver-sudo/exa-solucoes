
import React from 'react';
import { BuildingStore } from '@/services/buildingStoreService';
import { BuildingFilters } from '@/hooks/useBuildingStore';
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
  sidebarCollapsed?: boolean;
  onSidebarToggle?: () => void;
}

const BuildingStoreGridLayout: React.FC<BuildingStoreGridLayoutProps> = ({
  buildings,
  isLoading,
  isSearching,
  selectedLocation,
  filters,
  handleFilterChange,
  sidebarCollapsed = false,
  onSidebarToggle
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
            buildings={buildings}
            isLoading={isLoading}
            isSearching={isSearching}
            selectedLocation={selectedLocation}
          />
        </div>
      </div>
    );
  }

  // Lógica adaptativa para o grid baseado na quantidade de prédios
  const buildingCount = buildings?.length || 0;
  const shouldUseWideCards = sidebarCollapsed && buildingCount <= 3;

  // Layout desktop: Grid com sidebar lateral
  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
      {/* Left sidebar with filters - Desktop only - MAIS FINA */}
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
      
      {/* Main content with building grid - RESPONSIVO E INTELIGENTE */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:col-span-11' : 'lg:col-span-9'}`}>
        <div className={`w-full ${
          sidebarCollapsed 
            ? shouldUseWideCards 
              ? 'grid grid-cols-1 gap-6' // Cards largos quando poucos prédios
              : 'grid grid-cols-1 lg:grid-cols-2 gap-6' // 2 colunas quando muitos prédios
            : '' // Layout normal quando sidebar expandida
        }`}>
          <BuildingStoreGrid 
            buildings={buildings}
            isLoading={isLoading}
            isSearching={isSearching}
            selectedLocation={selectedLocation}
            wideMode={sidebarCollapsed}
          />
        </div>
      </div>
    </div>
  );
};

export default BuildingStoreGridLayout;
