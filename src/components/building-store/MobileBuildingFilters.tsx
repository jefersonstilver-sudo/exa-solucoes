
import React from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { BuildingFilters } from '@/hooks/useBuildingStore';
import BuildingFilterSidebar from './BuildingFilterSidebar';
import MobileMapDialog from './MobileMapDialog';

interface MobileBuildingFiltersProps {
  filters: BuildingFilters;
  handleFilterChange: (newFilters: Partial<BuildingFilters>) => void;
  isLoading: boolean;
  isSearching: boolean;
  buildingsCount: number;
}

const MobileBuildingFilters: React.FC<MobileBuildingFiltersProps> = ({
  filters,
  handleFilterChange,
  isLoading,
  isSearching,
  buildingsCount
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  // Contar filtros ativos: apenas Tipo de Prédio
  const activeFiltersCount = filters.venueType.length;

  return (
    <div className="space-y-3">
      {/* Header com contadores e ações */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-white to-gray-50 border-b border-gray-200 rounded-t-lg shadow-sm">
        <div className="text-sm font-medium text-gray-700">
          {buildingsCount} {buildingsCount === 1 ? 'prédio encontrado' : 'prédios encontrados'}
        </div>
        <div className="flex items-center space-x-2">
          {/* Botão do Mapa Mobile - Componente dedicado */}
          <MobileMapDialog buildingsCount={buildingsCount} />
        </div>
      </div>

      {/* Filtros */}
      <div className="px-4">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="flex items-center space-x-2 relative bg-white border-gray-300 hover:bg-gray-50"
            >
              <Filter className="h-4 w-4" />
              <span>Filtros</span>
              {activeFiltersCount > 0 && (
                <div className="absolute -top-2 -right-2 bg-[#3C1361] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {activeFiltersCount}
                </div>
              )}
            </Button>
          </SheetTrigger>
          
          <SheetContent side="left" className="w-[320px] p-0 overflow-y-auto">
            <SheetHeader className="p-4 border-b bg-gradient-to-r from-[#3C1361] to-[#4A1B6B]">
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
      </div>
    </div>
  );
};

export default MobileBuildingFilters;
