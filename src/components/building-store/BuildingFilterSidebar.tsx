
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { BuildingFilters } from '@/hooks/useBuildingStore';
import { Map, Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BuildingFiltersComponent from './BuildingFilters';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface BuildingFilterSidebarProps {
  filters: BuildingFilters;
  handleFilterChange: (filters: Partial<BuildingFilters>) => void;
  isLoading: boolean;
  isSearching: boolean;
}

const BuildingFilterSidebar: React.FC<BuildingFilterSidebarProps> = ({
  filters,
  handleFilterChange,
  isLoading,
  isSearching
}) => {
  const [mapOpen, setMapOpen] = useState(false);

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
          className="w-full border-2 border-[#3C1361]/20 text-[#3C1361] hover:bg-[#3C1361]/5 hover:border-[#3C1361]/40 rounded-2xl flex gap-3 justify-center items-center py-6 relative overflow-hidden group transition-all duration-300"
          onClick={() => setMapOpen(!mapOpen)}
        >
          <Map className="h-5 w-5 transition-transform group-hover:scale-110 duration-300" />
          <span className="relative z-10 font-semibold">{mapOpen ? "Fechar mapa" : "Ver no mapa"}</span>
          <span className="absolute bottom-0 left-0 h-0 w-full bg-[#3C1361]/5 transition-all duration-300 group-hover:h-full -z-0"></span>
        </Button>
      </motion.div>
      
      {/* Map Area (Expandable) */}
      <AnimatePresence>
        {mapOpen && (
          <motion.div 
            className="w-full rounded-2xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 relative border border-gray-200"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 300 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Map className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 text-sm bg-white/80 px-4 py-2 rounded-lg font-medium">
                  Mapa interativo será implementado em breve
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Mobile Filter Trigger */}
      <div className="lg:hidden w-full">
        <Sheet>
          <SheetTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full border-2 border-[#3C1361]/20 text-[#3C1361] hover:bg-[#3C1361]/5 hover:border-[#3C1361]/40 rounded-2xl py-6 font-semibold transition-all duration-300"
            >
              <Filter className="mr-3 h-5 w-5" />
              Filtrar prédios
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[85%] sm:w-[400px] overflow-y-auto p-0">
            <SheetHeader className="p-6 border-b border-gray-100">
              <SheetTitle className="text-xl font-bold text-[#3C1361] flex items-center">
                <Filter className="h-5 w-5 mr-3" />
                Filtrar Prédios
              </SheetTitle>
            </SheetHeader>
            <div className="p-6">
              <BuildingFiltersComponent 
                filters={filters} 
                onFilterChange={handleFilterChange}
                loading={isLoading || isSearching}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
      
      {/* Desktop Filter Sidebar */}
      <div className="hidden lg:block bg-white rounded-3xl border border-gray-100 shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-[#3C1361] to-[#3C1361]/90 p-6">
          <h3 className="text-xl font-bold text-white flex items-center">
            <Filter className="h-5 w-5 mr-3" />
            Filtrar Prédios
          </h3>
          <p className="text-white/80 text-sm mt-1">
            Encontre o prédio ideal para sua campanha
          </p>
        </div>
        <div className="p-6">
          <BuildingFiltersComponent 
            filters={filters}
            onFilterChange={handleFilterChange}
            loading={isLoading || isSearching}
            compact={true}
          />
        </div>
      </div>
    </div>
  );
};

export default BuildingFilterSidebar;
