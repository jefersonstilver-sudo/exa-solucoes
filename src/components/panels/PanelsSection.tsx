
import React from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Filter, Map, X } from 'lucide-react';
import { Panel } from '@/types/panel';
import { FilterOptions } from '@/types/filter';
import PanelFilters from '@/components/panels/PanelFilters';
import PanelList from '@/components/panels/PanelList';
import ResultsHeader from '@/components/panels/ResultsHeader';
import LoadingPanels from '@/components/panels/LoadingPanels';
import EmptyResults from '@/components/panels/EmptyResults';
import PanelMap from '@/components/panels/PanelMap';

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
  const [mapOpen, setMapOpen] = React.useState(false);
  
  const handlePanelSelect = (panel: Panel) => {
    const panelElement = document.getElementById(`panel-${panel.id}`);
    if (panelElement) {
      panelElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      panelElement.classList.add('highlight-panel');
      setTimeout(() => {
        panelElement.classList.remove('highlight-panel');
      }, 2000);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
      <div className="lg:col-span-3 xl:col-span-3 space-y-6">
        <div className="w-full mb-4 animate-fade-in">
          <Button
            variant="outline"
            className={`w-full border-[#3C1361] text-[#3C1361] hover:bg-[#3C1361]/10 hover:text-[#3C1361] rounded-xl flex gap-2 justify-center items-center py-6 ${
              mapOpen ? 'bg-[#3C1361]/10' : ''
            }`}
            onClick={() => setMapOpen(!mapOpen)}
          >
            <Map className="h-5 w-5" />
            {mapOpen ? "Fechar mapa" : "Abrir mapa"}
            {mapOpen && <X className="h-4 w-4 ml-2" />}
          </Button>
        </div>
        
        {mapOpen && panels && (
          <div className="transition-all duration-300">
            <PanelMap 
              panels={panels}
              selectedLocation={selectedLocation}
              onSelectPanel={handlePanelSelect}
            />
            <p className="text-xs text-gray-500 mt-2 text-center">
              Clique nos marcadores para ver detalhes dos painéis
            </p>
          </div>
        )}
        
        <div className="lg:hidden w-full">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full border-[#3C1361] text-[#3C1361] hover:bg-[#3C1361]/10 hover:text-[#3C1361] rounded-xl">
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
        
        <div className="hidden lg:block">
          <div className="sticky top-24">
            <PanelFilters 
              filters={filters} 
              onFilterChange={handleFilterChange}
              onSearch={handleSearch}
              loading={isLoading || isSearching}
            />
          </div>
        </div>
      </div>
      
      <div className="lg:col-span-9 xl:col-span-9">
        <ResultsHeader 
          isLoading={isLoading} 
          isSearching={isSearching} 
          panelsCount={panels?.length || 0} 
        />
        
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
