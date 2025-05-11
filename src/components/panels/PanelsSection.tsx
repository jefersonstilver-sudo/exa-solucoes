
import React from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';
import { Panel } from '@/types/panel';
import { FilterOptions } from '@/types/filter';
import PanelFilters from '@/components/panels/PanelFilters';
import PanelList from '@/components/panels/PanelList';
import ResultsHeader from '@/components/panels/ResultsHeader';
import LoadingPanels from '@/components/panels/LoadingPanels';
import EmptyResults from '@/components/panels/EmptyResults';

interface PanelsSectionProps {
  panels: Panel[] | undefined;
  isLoading: boolean;
  isSearching: boolean;
  selectedLocation: { lat: number, lng: number } | null;
  filters: FilterOptions;
  handleFilterChange: (filters: Partial<FilterOptions>) => void;
  handleSearch: (location: string) => Promise<void>;
  cartItems: { panel: Panel, duration: number }[];
  onAddToCart: (panel: Panel, duration?: number) => void;
}

const PanelsSection: React.FC<PanelsSectionProps> = ({
  panels,
  isLoading,
  isSearching,
  selectedLocation,
  filters,
  handleFilterChange,
  handleSearch,
  cartItems,
  onAddToCart
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Filters column */}
      <div className="lg:col-span-3 xl:col-span-3 space-y-6">
        {/* Mobile Filter Trigger */}
        <div className="lg:hidden w-full">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full border-indexa-purple text-indexa-purple">
                <Filter className="mr-2 h-4 w-4" />
                Filtrar por
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85%] sm:w-[350px] overflow-y-auto">
              <PanelFilters 
                filters={filters} 
                onFilterChange={handleFilterChange}
                onSearch={handleSearch}
                loading={isLoading || isSearching}
              />
            </SheetContent>
          </Sheet>
        </div>
        
        {/* Desktop Filter Sidebar */}
        <div className="hidden lg:block">
          <div className="bg-white p-5 rounded-lg shadow-lg border border-gray-200 sticky top-24 hover:shadow-xl transition-shadow duration-300">
            <h2 className="font-bold text-lg mb-5 text-gray-800">Filtrar por</h2>
            <PanelFilters 
              filters={filters} 
              onFilterChange={handleFilterChange}
              onSearch={handleSearch}
              loading={isLoading || isSearching}
            />
          </div>
        </div>
      </div>
      
      {/* Panel Results */}
      <div className="lg:col-span-9 xl:col-span-9">
        {/* Loading and result count */}
        <ResultsHeader 
          isLoading={isLoading} 
          isSearching={isSearching} 
          panelsCount={panels?.length || 0} 
        />
        
        {/* Panel list with loading and empty states */}
        {isLoading || isSearching ? (
          <LoadingPanels />
        ) : panels && panels.length > 0 ? (
          <PanelList 
            panels={panels} 
            isLoading={false}
            cartItems={cartItems}
            onAddToCart={onAddToCart}
          />
        ) : (
          <EmptyResults />
        )}
      </div>
    </div>
  );
};

export default PanelsSection;
