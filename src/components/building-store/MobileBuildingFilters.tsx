import React from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { BuildingFilters } from '@/hooks/useBuildingStore';
import BuildingFilterSidebar from './BuildingFilterSidebar';
import MobileMapDialog from './MobileMapDialog';
import MobileSortDialog from './MobileSortDialog';

interface MobileBuildingFiltersProps {
  filters: BuildingFilters;
  handleFilterChange: (newFilters: Partial<BuildingFilters>) => void;
  isLoading: boolean;
  isSearching: boolean;
  buildingsCount: number;
  sortOption: string;
  setSortOption: (option: string) => void;
  hasLocationSearch?: boolean;
}

const MobileBuildingFilters: React.FC<MobileBuildingFiltersProps> = ({
  filters,
  handleFilterChange,
  isLoading,
  isSearching,
  buildingsCount,
  sortOption,
  setSortOption,
  hasLocationSearch = false
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  // Contar filtros ativos: apenas Tipo de Prédio
  const activeFiltersCount = filters.venueType.length;

  return (
    <>
      {/* Barra de controle compacta - Layout horizontal único */}
      <div className="flex items-center justify-between p-3 bg-white border-b border-gray-200">
        {/* Contador à esquerda */}
        <div className="text-sm font-medium text-gray-700">
          {buildingsCount} {buildingsCount === 1 ? 'prédio' : 'prédios'}
        </div>
        
        {/* Grupo de ações à direita */}
        <div className="flex items-center gap-2">
          {/* Botão Filtros */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center space-x-1 relative bg-white border-gray-300 hover:bg-gray-50 h-9"
              >
                <Filter className="h-4 w-4" />
                <span className="text-xs">Filtros</span>
                {activeFiltersCount > 0 && (
                  <div className="absolute -top-1 -right-1 bg-[#9C1E1E] text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
                    {activeFiltersCount}
                  </div>
                )}
              </Button>
            </SheetTrigger>
            
            <SheetContent side="left" className="w-[320px] p-0 overflow-y-auto">
              <SheetHeader className="p-4 border-b bg-gradient-to-r from-[#9C1E1E] to-[#D72638]">
                <SheetTitle className="flex items-center justify-between text-white">
                  <div className="flex items-center space-x-2">
                    <Filter className="h-5 w-5" />
                    <span>Filtros Avançados</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="text-white hover:bg-white/20"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </SheetTitle>
              </SheetHeader>
              
              <div className="p-4 bg-gradient-to-b from-white to-gray-50">
                <BuildingFilterSidebar 
                  filters={filters}
                  handleFilterChange={handleFilterChange}
                  isLoading={isLoading}
                  isSearching={isSearching}
                />
              </div>
            </SheetContent>
          </Sheet>

          {/* Botão Mapa */}
          <MobileMapDialog 
            buildingsCount={buildingsCount}
            className="h-9"
          />

          {/* Botão Ordenar */}
          <MobileSortDialog
            sortOption={sortOption}
            onSortChange={setSortOption}
            hasLocationSearch={hasLocationSearch}
          />
        </div>
      </div>
    </>
  );
};

export default MobileBuildingFilters;

