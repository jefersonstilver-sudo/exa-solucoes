
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { BuildingFilters } from '@/hooks/useBuildingStore';
import { Map, Filter, Sparkles } from 'lucide-react';
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
    <div className="space-y-4 sticky top-24">
      {/* Map Toggle Button */}
      <motion.div 
        className="w-full"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Button
          variant="outline"
          className="w-full border-2 border-gradient-to-r from-[#3C1361]/20 to-[#3C1361]/30 text-[#3C1361] hover:bg-gradient-to-r hover:from-[#3C1361]/5 hover:to-[#3C1361]/10 hover:border-[#3C1361]/50 rounded-2xl flex gap-3 justify-center items-center py-6 relative overflow-hidden group transition-all duration-300 shadow-sm hover:shadow-md"
          onClick={() => setMapOpen(!mapOpen)}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#3C1361]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <Map className="h-5 w-5 transition-transform group-hover:scale-110 duration-300 relative z-10" />
          <span className="relative z-10 font-semibold">{mapOpen ? "Fechar mapa" : "Ver no mapa"}</span>
          <Sparkles className="h-4 w-4 text-[#3C1361]/50 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </Button>
      </motion.div>
      
      {/* Map Area (Expandable) */}
      <AnimatePresence>
        {mapOpen && (
          <motion.div 
            className="w-full rounded-2xl overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100 relative border-2 border-gray-200/50 shadow-lg"
            initial={{ opacity: 0, height: 0, scale: 0.95 }}
            animate={{ opacity: 1, height: 300, scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center p-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  <Map className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                </motion.div>
                <motion.p 
                  className="text-gray-500 text-sm bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg font-medium shadow-sm border border-gray-200/50"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Mapa interativo será implementado em breve
                </motion.p>
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
              className="w-full border-2 border-[#3C1361]/20 text-[#3C1361] hover:bg-gradient-to-r hover:from-[#3C1361]/5 hover:to-[#3C1361]/10 hover:border-[#3C1361]/40 rounded-2xl py-6 font-semibold transition-all duration-300 shadow-sm hover:shadow-md group"
            >
              <Filter className="mr-3 h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
              Filtrar prédios
              <motion.div 
                className="ml-auto h-2 w-2 bg-[#3C1361] rounded-full opacity-50"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[85%] sm:w-[400px] overflow-y-auto p-0 bg-gradient-to-b from-white to-gray-50/30">
            <SheetHeader className="p-6 border-b border-gray-100 bg-gradient-to-r from-[#3C1361] to-[#3C1361]/90">
              <SheetTitle className="text-xl font-bold text-white flex items-center">
                <Filter className="h-5 w-5 mr-3" />
                Filtrar Prédios
                <Sparkles className="h-4 w-4 ml-auto text-white/70" />
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
      <motion.div 
        className="hidden lg:block bg-white rounded-3xl border-2 border-gray-100/50 shadow-xl overflow-hidden backdrop-blur-sm"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="bg-gradient-to-r from-[#3C1361] via-[#3C1361] to-[#4A1B6B] p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
          <h3 className="text-xl font-bold text-white flex items-center relative z-10">
            <Filter className="h-5 w-5 mr-3" />
            Filtrar Prédios
            <Sparkles className="h-4 w-4 ml-auto text-white/70" />
          </h3>
          <p className="text-white/80 text-sm mt-1 relative z-10">
            Encontre o prédio ideal para sua campanha
          </p>
        </div>
        <div className="p-6 bg-gradient-to-b from-white to-gray-50/30">
          <BuildingFiltersComponent 
            filters={filters}
            onFilterChange={handleFilterChange}
            loading={isLoading || isSearching}
            compact={true}
          />
        </div>
      </motion.div>
    </div>
  );
};

export default BuildingFilterSidebar;
