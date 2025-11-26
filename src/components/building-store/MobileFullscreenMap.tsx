import React, { useState, useEffect } from 'react';
import { X, Navigation } from 'lucide-react';
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

  // Helper to count buildings with valid coordinates (checks both manual and auto coordinates)
  const hasValidCoordinates = (b: BuildingStore) => {
    // Check manual_latitude/manual_longitude first
    if (b.manual_latitude && b.manual_longitude && 
        b.manual_latitude !== 0 && b.manual_longitude !== 0) {
      return true;
    }
    // Check latitude/longitude as fallback
    if (b.latitude && b.longitude && 
        b.latitude !== 0 && b.longitude !== 0) {
      return true;
    }
    return false;
  };

  const validBuildingsCount = buildings?.filter(hasValidCoordinates).length || 0;

  return (
    <>
      {/* Background Layer - Map Container */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[9999] bg-background"
      >
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
            gestureHandling="greedy"
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
      </motion.div>

      {/* UI Controls Layer - OUTSIDE map container */}
      {/* Elegant Red Close Button - Top Left */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="fixed top-4 left-4 z-[10000]"
      >
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="h-12 w-12 rounded-full bg-red-600 shadow-[0_4px_20px_rgba(220,38,38,0.5)] hover:bg-red-700 hover:scale-105 hover:shadow-[0_6px_30px_rgba(220,38,38,0.6)] transition-all duration-200 active:scale-95 border-0"
        >
          <X className="h-5 w-5 text-white" strokeWidth={2.5} />
        </Button>
      </motion.div>

      {/* Glass-style Buildings Badge - Top Right */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="fixed top-4 right-4 z-[10000]"
      >
        <Badge 
          variant="secondary" 
          className="h-14 px-5 rounded-full bg-white/95 backdrop-blur-xl border-2 border-gray-300 shadow-[0_8px_32px_rgba(0,0,0,0.2)] text-base font-bold text-gray-800 flex items-center gap-2"
        >
          <Navigation className="h-5 w-5 text-blue-600" />
          <span className="text-gray-800">{validBuildingsCount}</span>
        </Badge>
      </motion.div>

      {/* Bottom Sheet for Selected Building */}
      <AnimatePresence>
        {selectedBuilding && (
          <MobileBuildingSheet 
            building={selectedBuilding}
            onClose={handleCloseBuildingCard}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileFullscreenMap;
