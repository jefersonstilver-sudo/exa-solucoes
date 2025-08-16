import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Map, Menu, X, Maximize2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import BuildingMap from '@/components/building-store/BuildingMap';
// Simple interface for map compatibility
interface MapBuilding {
  id: string;
  nome: string;
  endereco: string;
  bairro: string;
  cidade: string;
  estado: string;
  latitude: number;
  longitude: number;
  venue_type: string;
  location_type: string;
  status: string;
  preco_base: number;
}

interface PanelStoreMapSidebarProps {
  buildings: MapBuilding[];
  isCollapsed?: boolean;
  onToggle?: () => void;
  isLoading?: boolean;
}

const PanelStoreMapSidebar: React.FC<PanelStoreMapSidebarProps> = ({
  buildings,
  isCollapsed = false,
  onToggle,
  isLoading
}) => {
  const [mapOpen, setMapOpen] = useState(true); // Start with map open
  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);

  // Calculate center based on buildings with coordinates
  const buildingsWithCoords = buildings.filter(b => b.latitude && b.longitude);
  const selectedLocation = buildingsWithCoords.length > 0 ? {
    lat: buildingsWithCoords[0].latitude!,
    lng: buildingsWithCoords[0].longitude!
  } : null;

  // Convert MapBuilding to BuildingStore format for BuildingMap component
  const buildingsForMap = buildings.map(building => ({
    id: building.id,
    nome: building.nome,
    endereco: building.endereco,
    bairro: building.bairro,
    cidade: building.cidade,
    estado: building.estado,
    cep: '',
    latitude: building.latitude,
    longitude: building.longitude,
    venue_type: building.venue_type,
    location_type: building.location_type,
    status: building.status,
    preco_base: building.preco_base,
    publico_estimado: 0,
    visualizacoes_mes: 0,
    monthly_traffic: 0,
    numero_unidades: 0,
    quantidade_telas: 0,
    imagem_principal: '',
    imagem_2: '',
    imagem_3: '',
    imagem_4: '',
    imagens: [],
    amenities: [],
    caracteristicas: [],
    padrao_publico: 'normal' as const
  }));

  return (
    <div className={`space-y-3 sticky top-24 transition-all duration-300 ${isCollapsed ? 'w-14' : 'w-full'}`}>
      {/* Collapse/Expand Toggle Button */}
      {onToggle && (
        <motion.div 
          className="w-full"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Button
            variant="outline"
            className={`border-2 border-[#3C1361]/20 text-[#3C1361] hover:bg-[#3C1361]/5 hover:border-[#3C1361]/50 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md group ${
              isCollapsed ? 'w-14 h-14 p-0' : 'w-full py-3'
            }`}
            onClick={onToggle}
          >
            <div className="relative">
              {isCollapsed ? (
                <Menu className="h-5 w-5 transition-transform group-hover:scale-110 duration-300" />
              ) : (
                <div className="flex items-center gap-3">
                  <X className="h-5 w-5 transition-transform group-hover:rotate-90 duration-300" />
                  <span className="font-semibold">Recolher filtros</span>
                </div>
              )}
            </div>
          </Button>
        </motion.div>
      )}
      
      {/* Map Toggle Button */}
      {!isCollapsed && (
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
      )}
      
      {/* Collapsed state - Map icon only */}
      {isCollapsed && (
        <motion.div 
          className="w-full"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Button
            variant="outline"
            className="w-14 h-14 border-2 border-[#3C1361]/20 text-[#3C1361] hover:bg-[#3C1361]/5 hover:border-[#3C1361]/50 rounded-xl p-0 transition-all duration-300 shadow-sm hover:shadow-md group"
            onClick={() => setMapOpen(!mapOpen)}
          >
            <Map className="h-5 w-5 transition-transform group-hover:scale-110 duration-300" />
          </Button>
        </motion.div>
      )}
      
      {/* Map Area (Expandable) */}
      <AnimatePresence>
        {mapOpen && !isCollapsed && (
          <motion.div 
            className="w-full rounded-2xl overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100 relative border-2 border-gray-200/50 shadow-lg"
            initial={{ opacity: 0, height: 0, scale: 0.95 }}
            animate={{ opacity: 1, height: 300, scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            <div className="absolute inset-0">
            <BuildingMap 
              buildings={buildingsForMap}
              selectedLocation={selectedLocation}
              scrollwheel={false}
              defaultZoom={13}
              requirePreciseGeocode={false}
            />
              <div className="absolute top-2 right-2 z-10">
                <Button
                  variant="outline"
                  className="border-2 border-[#3C1361]/20 text-[#3C1361] bg-white/90 hover:bg-white rounded-lg px-3 py-2 h-9 flex items-center gap-2 shadow-sm"
                  onClick={() => setIsMapDialogOpen(true)}
                >
                  <Maximize2 className="h-4 w-4" />
                  <span className="hidden sm:inline text-sm font-medium">Expandir</span>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-screen Map Dialog */}
      <Dialog open={isMapDialogOpen} onOpenChange={setIsMapDialogOpen}>
        <DialogContent className="max-w-[96vw] w-[96vw] p-0">
          <div className="w-full h-[82vh]">
            <BuildingMap 
              buildings={buildingsForMap} 
              selectedLocation={selectedLocation} 
              scrollwheel={true} 
              defaultZoom={15} 
              requirePreciseGeocode={false}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PanelStoreMapSidebar;