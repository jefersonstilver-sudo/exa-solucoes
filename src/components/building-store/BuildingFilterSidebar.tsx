import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { BuildingFilters } from '@/hooks/useBuildingStore';
import { Map, Filter, Sparkles, Menu, X, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BuildingFiltersComponent from './BuildingFilters';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import BuildingMap from './BuildingMap';
import { BuildingStore } from '@/services/buildingStoreService';
import useBuildingStore from '@/hooks/building-store/useBuildingStore';
interface BuildingFilterSidebarProps {
  filters: BuildingFilters;
  handleFilterChange: (filters: Partial<BuildingFilters>) => void;
  isLoading: boolean;
  isSearching: boolean;
  isCollapsed?: boolean;
  onToggle?: () => void;
}
const BuildingFilterSidebar: React.FC<BuildingFilterSidebarProps> = React.memo(({
  filters,
  handleFilterChange,
  isLoading,
  isSearching,
  isCollapsed = false,
  onToggle
}) => {
  const [mapOpen, setMapOpen] = useState(false);
  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);
  const selectedLocation = useBuildingStore(s => s.selectedLocation);
  const [mapBuildings, setMapBuildings] = useState<BuildingStore[]>([]);
  useEffect(() => {
    if (!mapOpen) return;
    // Sync buildings only when map is visible to avoid unnecessary re-renders
    setMapBuildings(useBuildingStore.getState().buildings);
    const unsub = useBuildingStore.subscribe(state => setMapBuildings(state.buildings));
    return () => unsub();
  }, [mapOpen]);
  return <div className={`space-y-3 sticky top-24 transition-all duration-300 ${isCollapsed ? 'w-14' : 'w-full'}`}>
      {/* Hamburger Toggle Button */}
      {onToggle && <motion.div className="w-full" initial={false} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      delay: 0.05
    }}>
          
        </motion.div>}
      
      {/* Map Toggle Button */}
      {!isCollapsed && <motion.div className="w-full" initial={false} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      delay: 0.1
    }}>
          <Button variant="outline" className="w-full border-2 border-gradient-to-r from-[#9C1E1E]/20 to-[#9C1E1E]/30 text-[#9C1E1E] hover:bg-gradient-to-r hover:from-[#9C1E1E]/5 hover:to-[#9C1E1E]/10 hover:border-[#9C1E1E]/50 rounded-2xl flex gap-3 justify-center items-center py-6 relative overflow-hidden group transition-all duration-300 shadow-sm hover:shadow-md" onClick={() => setMapOpen(!mapOpen)}>
            <div className="absolute inset-0 bg-gradient-to-r from-[#9C1E1E]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <Map className="h-5 w-5 transition-transform group-hover:scale-110 duration-300 relative z-10" />
            <span className="relative z-10 font-semibold">{mapOpen ? "Fechar mapa" : "Ver no mapa"}</span>
            <Sparkles className="h-4 w-4 text-[#9C1E1E]/50 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Button>
        </motion.div>}
      
      {/* Collapsed state - Map icon only */}
      {isCollapsed && <motion.div className="w-full" initial={false} animate={{
      opacity: 1,
      scale: 1
    }} transition={{
      delay: 0.1
    }}>
          <Button variant="outline" className="w-14 h-14 border-2 border-[#9C1E1E]/20 text-[#9C1E1E] hover:bg-[#9C1E1E]/5 hover:border-[#9C1E1E]/50 rounded-xl p-0 transition-all duration-300 shadow-sm hover:shadow-md group" onClick={() => setMapOpen(!mapOpen)}>
            <Map className="h-5 w-5 transition-transform group-hover:scale-110 duration-300" />
          </Button>
        </motion.div>}
      
      {/* Map Area (Expandable) */}
      <AnimatePresence>
        {mapOpen && <motion.div className="w-full rounded-2xl overflow-visible bg-gradient-to-br from-gray-50 via-white to-gray-100 relative border-2 border-gray-200/50 shadow-lg" initial={{
        opacity: 0,
        height: 0,
        scale: 0.95
      }} animate={{
        opacity: 1,
        height: 300,
        scale: 1
      }} exit={{
        opacity: 0,
        height: 0,
        scale: 0.95
      }} transition={{
        duration: 0.4,
        ease: "easeInOut"
      }}>
            <div className="absolute inset-0">
              <BuildingMap buildings={mapBuildings} selectedLocation={selectedLocation} scrollwheel={false} requirePreciseGeocode={false} enableClustering={false} autoFitAllBuildings={!selectedLocation} />
              <div className="absolute top-2 right-2 z-10">
                <Button variant="outline" className="border-2 border-[#9C1E1E]/20 text-[#9C1E1E] bg-white/90 hover:bg-white rounded-lg px-3 py-2 h-9 flex items-center gap-2 shadow-sm" onClick={() => setIsMapDialogOpen(true)}>
                  <Maximize2 className="h-4 w-4" />
                  <span className="hidden sm:inline text-sm font-medium">Expandir</span>
                </Button>
              </div>
            </div>
          </motion.div>}
      </AnimatePresence>

      {/* Full-screen Map Dialog */}
      <Dialog open={isMapDialogOpen} onOpenChange={setIsMapDialogOpen}>
        <DialogContent className="max-w-[96vw] w-[96vw] p-0">
          <div className="w-full h-[82vh]">
            <BuildingMap buildings={mapBuildings} selectedLocation={selectedLocation} scrollwheel={true} defaultZoom={15} requirePreciseGeocode={false} enableClustering={false} />
          </div>
        </DialogContent>
      </Dialog>
      <div className="lg:hidden w-full">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full border-2 border-[#9C1E1E]/20 text-[#9C1E1E] hover:bg-gradient-to-r hover:from-[#9C1E1E]/5 hover:to-[#9C1E1E]/10 hover:border-[#9C1E1E]/40 rounded-2xl py-6 font-semibold transition-all duration-300 shadow-sm hover:shadow-md group">
              <Filter className="mr-3 h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
              Filtrar prédios
              <motion.div className="ml-auto h-2 w-2 bg-[#9C1E1E] rounded-full opacity-50" animate={{
              scale: [1, 1.2, 1]
            }} transition={{
              duration: 2,
              repeat: Infinity
            }} />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[85%] sm:w-[400px] overflow-y-auto p-0 bg-gradient-to-b from-white to-gray-50/30">
            <SheetHeader className="p-6 border-b border-gray-100 bg-gradient-to-r from-[#9C1E1E] to-[#9C1E1E]/90">
              <SheetTitle className="text-xl font-bold text-white flex items-center">
                <Filter className="h-5 w-5 mr-3" />
                Filtrar Prédios
                <Sparkles className="h-4 w-4 ml-auto text-white/70" />
              </SheetTitle>
            </SheetHeader>
            <div className="p-6">
              <BuildingFiltersComponent filters={filters} onFilterChange={handleFilterChange} loading={isLoading || isSearching} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
      
      {/* Desktop Filter Sidebar - MAIS FINA */}
      {!isCollapsed && <motion.div className="hidden lg:block bg-white rounded-2xl border-2 border-gray-100/50 shadow-lg overflow-hidden backdrop-blur-sm" initial={false} animate={{
      opacity: 1,
      x: 0
    }} transition={{
      delay: 0.1
    }}>
          <div className="bg-gradient-to-r from-[#9C1E1E] via-[#9C1E1E] to-[#D72638] p-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent"></div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-12 translate-x-12"></div>
            <h3 className="text-lg font-bold text-white flex items-center relative z-10">
              <Filter className="h-4 w-4 mr-2" />
              Filtrar
              <Sparkles className="h-3 w-3 ml-auto text-white/70" />
            </h3>
            <p className="text-white/80 text-xs mt-1 relative z-10">
              Encontre o prédio ideal
            </p>
          </div>
          <div className="p-4 bg-gradient-to-b from-white to-gray-50/30">
            <BuildingFiltersComponent filters={filters} onFilterChange={handleFilterChange} loading={isLoading || isSearching} compact={true} />
          </div>
        </motion.div>}
      
      {/* Collapsed state - Filter icons only */}
      {isCollapsed && <motion.div className="hidden lg:block space-y-3" initial={false} animate={{
      opacity: 1,
      x: 0
    }} transition={{
      delay: 0.1
    }}>
          <div className="w-14 h-14 bg-white rounded-xl border-2 border-gray-100/50 shadow-lg flex items-center justify-center">
            <Filter className="h-4 w-4 text-[#9C1E1E]" />
          </div>
        </motion.div>}
    </div>;
});
BuildingFilterSidebar.displayName = 'BuildingFilterSidebar';
export default BuildingFilterSidebar;