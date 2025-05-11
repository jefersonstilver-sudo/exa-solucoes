
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
  const [isMiniMapMounted, setIsMiniMapMounted] = useState(true);
  const [isFullMapMounted, setIsFullMapMounted] = useState(false);
  
  console.log("MiniMap renderizando - Dialog open:", open);
  
  // Mount/unmount the complete map based on dialog state
  useEffect(() => {
    if (open) {
      // Allow a small delay to mount the complete map
      // after dialog animation starts
      const timer = setTimeout(() => {
        setIsFullMapMounted(true);
      }, 300);
      
      return () => clearTimeout(timer);
    } else {
      // Give time for dialog to close before unmounting the complete map
      const timer = setTimeout(() => {
        setIsFullMapMounted(false);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [open]);
  
  // Dialog open handler
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
          {isMiniMapMounted && (
            <div className="h-full w-full">
              <PanelMap
                panels={panels}
                selectedLocation={selectedLocation}
                onAddToCart={onAddToCart}
                miniMap={true}
              />
            </div>
          )}
          <div 
            className="absolute inset-0 bg-transparent cursor-pointer"
            onClick={() => setOpen(true)}
            title="Clique para expandir o mapa"
          />
        </div>
      </div>

      {/* Use Dialog for full map */}
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
            {/* Render the complete map only when dialog is open and component is mounted */}
            {open && isFullMapMounted && (
              <div className="h-full w-full">
                <PanelMap
                  panels={panels}
                  selectedLocation={selectedLocation}
                  onAddToCart={onAddToCart}
                  miniMap={false}
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
