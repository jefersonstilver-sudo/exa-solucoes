import React, { useState, useEffect } from 'react';
import { ArrowLeft, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import BuildingMap from './BuildingMap';
import MobileBuildingSheet from './MobileBuildingSheet';
import useBuildingStore from '@/hooks/building-store/useBuildingStore';
import { BuildingStore } from '@/services/buildingStoreService';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileFullscreenMapProps {
  onClose: () => void;
}

const MobileFullscreenMap: React.FC<MobileFullscreenMapProps> = ({ onClose }) => {
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingStore | null>(null);
  const { buildings, selectedLocation } = useBuildingStore();

  // Listen for mobile building card events
  useEffect(() => {
    const handleShowMobileCard = (event: CustomEvent) => {
      setSelectedBuilding(event.detail.building);
    };

    window.addEventListener('showMobileBuildingCard', handleShowMobileCard as EventListener);
    
    return () => {
      window.removeEventListener('showMobileBuildingCard', handleShowMobileCard as EventListener);
    };
  }, []);

  const handleCloseBuildingCard = () => {
    setSelectedBuilding(null);
  };

  const validBuildingsCount = buildings?.filter(b => 
    b.latitude && b.longitude && 
    b.latitude !== 0 && b.longitude !== 0
  ).length || 0;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[9999] bg-background"
    >
      {/* Glass-style Back Button - Top Left */}
      <div className="absolute top-4 left-4 z-[10001] pointer-events-auto">
        <Button
          onClick={onClose}
          className="h-12 w-12 rounded-full bg-background/95 backdrop-blur-xl border-2 border-border/40 shadow-2xl hover:bg-background hover:scale-105 hover:border-border/60 transition-all duration-200 p-0 flex items-center justify-center"
        >
          <ArrowLeft className="h-6 w-6 text-foreground" />
        </Button>
      </div>

      {/* Glass-style Buildings Badge - Top Right */}
      <div className="absolute top-4 right-4 z-[10001] pointer-events-auto">
        <Badge 
          variant="secondary" 
          className="h-12 px-4 rounded-full bg-background/95 backdrop-blur-xl border-2 border-border/40 shadow-2xl text-base font-semibold text-foreground flex items-center gap-2"
        >
          <Navigation className="h-5 w-5" />
          {validBuildingsCount} {validBuildingsCount === 1 ? 'prédio' : 'prédios'}
        </Badge>
      </div>

      {/* Fullscreen Map */}
      <div className="w-full h-full">
        {buildings && buildings.length > 0 ? (
          <BuildingMap 
            buildings={buildings} 
            selectedLocation={null}
            scrollwheel={true} 
            defaultZoom={14}
            enableClustering={false}
            requirePreciseGeocode={false}
            autoFitAllBuildings={true}
            hideDefaultControls={true}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted/20">
            <div className="text-center p-8">
              <Navigation className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Nenhum prédio encontrado
              </h3>
              <p className="text-muted-foreground text-base">
                Ajuste os filtros para visualizar prédios no mapa
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Sheet for Selected Building */}
      <AnimatePresence>
        {selectedBuilding && (
          <MobileBuildingSheet 
            building={selectedBuilding}
            onClose={handleCloseBuildingCard}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MobileFullscreenMap;
