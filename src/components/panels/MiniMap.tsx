
import React, { useState, useEffect } from 'react';
import { MapPin, Maximize2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import PanelMap from './PanelMap';
import { Panel } from '@/types/panel';

interface MiniMapProps {
  panels: Panel[];
  selectedLocation: { lat: number, lng: number } | null;
  onAddToCart?: (panel: Panel, duration: number) => void;
}

const MiniMap: React.FC<MiniMapProps> = ({ panels, selectedLocation, onAddToCart }) => {
  const [open, setOpen] = useState(false);
  const [isMiniMapVisible, setIsMiniMapVisible] = useState(true);
  const [isFullMapVisible, setIsFullMapVisible] = useState(false);
  
  console.log("MiniMap renderizando - Dialog open:", open);
  
  // Handle dialog state changes
  useEffect(() => {
    if (open) {
      // Delay mounting the full map until dialog animation starts
      const timer = setTimeout(() => {
        setIsFullMapVisible(true);
      }, 300);
      
      return () => clearTimeout(timer);
    } else {
      // Delay unmounting the full map until dialog animation completes
      const timer = setTimeout(() => {
        setIsFullMapVisible(false);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [open]);
  
  // Dialog open handler with safety checks
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
  };
  
  return (
    <>
      <div className="rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gray-50 p-3 flex justify-between items-center border-b">
          <div className="flex items-center text-gray-700">
            <MapPin className="w-4 h-4 mr-2 text-indexa-purple" />
            <span className="font-medium">Mapa de Painéis</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-gray-600 hover:text-indexa-purple"
            onClick={() => setOpen(true)}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
        <div className="h-[180px] relative">
          {/* Only render mini map when needed */}
          {isMiniMapVisible && (
            <div className="h-full w-full">
              <PanelMap
                panels={panels}
                selectedLocation={selectedLocation}
                onAddToCart={onAddToCart}
                miniMap={true}
                key="mini-map-instance"
              />
            </div>
          )}
          {/* Overlay for click handling */}
          <div 
            className="absolute inset-0 bg-transparent cursor-pointer"
            onClick={() => setOpen(true)}
            title="Clique para expandir o mapa"
          />
        </div>
      </div>

      {/* Full map dialog */}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] p-0">
          <DialogHeader className="p-4 border-b">
            <div className="flex justify-between items-center">
              <DialogTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-indexa-purple" />
                Mapa de Painéis Digitais
              </DialogTitle>
              <DialogClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
            </div>
          </DialogHeader>
          <div className="h-[500px]">
            {/* Only render full map when dialog is open AND component is mounted */}
            {open && isFullMapVisible && (
              <div className="h-full w-full">
                <PanelMap
                  panels={panels}
                  selectedLocation={selectedLocation}
                  onAddToCart={onAddToCart}
                  miniMap={false}
                  key="full-map-instance"
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MiniMap;
