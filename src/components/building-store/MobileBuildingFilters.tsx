
import React from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { BuildingFilters } from '@/hooks/useBuildingStore';
import BuildingFilterSidebar from './BuildingFilterSidebar';

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
    <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
      <div className="flex items-center space-x-3">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="flex items-center space-x-2 relative"
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
          
          <SheetContent side="left" className="w-[300px] p-0">
            <SheetHeader className="p-4 border-b">
              <SheetTitle className="flex items-center justify-between">
                <span>Filtros</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </SheetTitle>
            </SheetHeader>
            
            <div className="p-4">
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

      <div className="text-sm text-gray-600">
        {buildingsCount} {buildingsCount === 1 ? 'prédio' : 'prédios'}
      </div>
    </div>
  );
};

export default MobileBuildingFilters;
