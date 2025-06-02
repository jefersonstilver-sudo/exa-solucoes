
import React from 'react';
import { motion } from 'framer-motion';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { BuildingFilters } from '@/hooks/useBuildingStore';
import { useIsMobile } from '@/hooks/use-mobile';
import BuildingFilterContent from './filters/BuildingFilterContent';

interface BuildingStoreFiltersProps {
  filters: BuildingFilters;
  onFilterChange: (filters: Partial<BuildingFilters>) => void;
  isLoading: boolean;
  buildingsCount: number;
}

const BuildingStoreFilters: React.FC<BuildingStoreFiltersProps> = ({
  filters,
  onFilterChange,
  isLoading,
  buildingsCount
}) => {
  const isMobile = useIsMobile();

  const handleResetFilters = () => {
    console.log('🔍 [FILTERS] Resetando todos os filtros');
    onFilterChange({
      neighborhood: '',
      venueType: [],
      priceRange: [0, 10000],
      audienceMin: 0,
      standardProfile: [],
      amenities: [],
      sortBy: 'relevance'
    });
  };

  // Check if any filters are active
  const hasActiveFilters = (
    filters.neighborhood.trim() !== '' ||
    filters.venueType.length > 0 ||
    filters.priceRange[0] > 0 || 
    filters.priceRange[1] < 10000 ||
    filters.audienceMin > 0 ||
    filters.standardProfile.length > 0 ||
    filters.amenities.length > 0
  );

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full border-[#3C1361] text-[#3C1361] hover:bg-[#3C1361]/10 relative"
          >
            <Filter className="mr-2 h-4 w-4" />
            Filtros
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 bg-[#3C1361] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                !
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[85%] sm:w-[350px] overflow-y-auto">
          <div className="py-4">
            <BuildingFilterContent
              filters={filters}
              onFilterChange={onFilterChange}
              onResetFilters={handleResetFilters}
              isLoading={isLoading}
              buildingsCount={buildingsCount}
              hasActiveFilters={hasActiveFilters}
            />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-[#3C1361] flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtros
            {hasActiveFilters && (
              <span className="ml-2 bg-[#3C1361] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                !
              </span>
            )}
          </h3>
          
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="text-gray-500 hover:text-[#3C1361]"
            >
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>

        <BuildingFilterContent
          filters={filters}
          onFilterChange={onFilterChange}
          onResetFilters={handleResetFilters}
          isLoading={isLoading}
          buildingsCount={buildingsCount}
          hasActiveFilters={hasActiveFilters}
        />
      </div>
    </motion.div>
  );
};

export default BuildingStoreFilters;
