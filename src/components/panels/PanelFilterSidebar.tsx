
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FilterOptions } from '@/types/filter';
import { Map, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PanelFilters from '@/components/panels/PanelFilters';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface PanelFilterSidebarProps {
  filters: FilterOptions;
  handleFilterChange: (filters: Partial<FilterOptions>) => void;
  isLoading: boolean;
  isSearching: boolean;
}

const PanelFilterSidebar: React.FC<PanelFilterSidebarProps> = ({
  filters,
  handleFilterChange,
  isLoading,
  isSearching
}) => {
  // Map toggle state
  const [mapOpen, setMapOpen] = useState(false);

  // Define a search function
  const handleSearch = async (location: string) => {
    // This is just a placeholder - the actual implementation will come from the parent
    console.log("Search requested for:", location);
  };

  return (
    <div className="space-y-6 sticky top-24">
      {/* Map Toggle Button */}
      <motion.div 
        className="w-full mb-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Button
          variant="outline"
          className="w-full border-[#3C1361] text-[#3C1361] hover:bg-[#3C1361]/10 hover:text-[#3C1361] rounded-xl flex gap-2 justify-center items-center py-6 relative overflow-hidden group"
          onClick={() => setMapOpen(!mapOpen)}
        >
          <Map className="h-5 w-5 transition-transform group-hover:scale-110 duration-300" />
          <span className="relative z-10">{mapOpen ? "Fechar mapa" : "Abrir mapa"}</span>
          <span className="absolute bottom-0 left-0 h-0 w-full bg-[#3C1361]/10 transition-all duration-300 group-hover:h-full -z-0"></span>
        </Button>
      </motion.div>
      
      {/* Map Area (Expandable) */}
      <AnimatePresence>
        {mapOpen && (
          <motion.div 
            className="w-full rounded-xl overflow-hidden bg-gray-100 relative"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 300 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-gray-500 text-sm bg-white/80 px-3 py-2 rounded-lg">
                Mapa será implementado em breve
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Mobile Filter Trigger */}
      <div className="lg:hidden w-full">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full border-[#3C1361] text-[#3C1361] hover:bg-[#3C1361]/10 hover:text-[#3C1361] rounded-xl">
              <Filter className="mr-2 h-4 w-4" />
              Filtrar painéis
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
      <div className="hidden lg:block bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-5">
          <h3 className="text-lg font-semibold text-[#3C1361] mb-4 flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Filtrar painéis
          </h3>
          <div className="space-y-4">
            <PanelFilters 
              filters={filters}
              onFilterChange={handleFilterChange}
              onSearch={handleSearch}
              loading={isLoading || isSearching}
              compact={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PanelFilterSidebar;
