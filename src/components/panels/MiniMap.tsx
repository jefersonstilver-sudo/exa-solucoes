
import React, { useState, useEffect, useRef } from 'react';
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
  const [miniMapKey] = useState(`mini-${Math.random().toString(36).substring(2, 9)}`);
  const [fullMapKey] = useState(`full-${Math.random().toString(36).substring(2, 9)}`);
  const [shouldRenderFullMap, setShouldRenderFullMap] = useState(false);
  const componentMounted = useRef(true);
  const dialogTransitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track component mounting status
  useEffect(() => {
    componentMounted.current = true;
    return () => {
      componentMounted.current = false;
      if (dialogTransitionTimeoutRef.current !== null) {
        clearTimeout(dialogTransitionTimeoutRef.current);
        dialogTransitionTimeoutRef.current = null;
      }
    };
  }, []);
  
  // Handle dialog state changes to prevent DOM manipulation conflicts
  useEffect(() => {
    // Clear any existing timeout safely
    if (dialogTransitionTimeoutRef.current !== null) {
      clearTimeout(dialogTransitionTimeoutRef.current);
      dialogTransitionTimeoutRef.current = null;
    }
    
    // When dialog opens, prepare to show full map
    if (open) {
      // Small delay to ensure dialog animation starts first
      dialogTransitionTimeoutRef.current = setTimeout(() => {
        if (componentMounted.current) {
          setShouldRenderFullMap(true);
        }
        dialogTransitionTimeoutRef.current = null;
      }, 100);
    } else {
      // When dialog closes, wait for animation to complete before unmounting
      dialogTransitionTimeoutRef.current = setTimeout(() => {
        if (componentMounted.current) {
          setShouldRenderFullMap(false);
        }
        dialogTransitionTimeoutRef.current = null;
      }, 300);
    }
    
    return () => {
      if (dialogTransitionTimeoutRef.current !== null) {
        clearTimeout(dialogTransitionTimeoutRef.current);
        dialogTransitionTimeoutRef.current = null;
      }
    };
  }, [open]);
  
  // Dialog open handler with safety
  const handleOpenChange = (newOpen: boolean) => {
    if (componentMounted.current) {
      setOpen(newOpen);
    }
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
            onClick={() => handleOpenChange(true)}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
        <div className="h-[180px] relative">
          {/* Mini map with unique key */}
          <div className="h-full w-full">
            <PanelMap
              panels={panels}
              selectedLocation={selectedLocation}
              onAddToCart={onAddToCart}
              miniMap={true}
              instanceId={miniMapKey}
              key={miniMapKey}
            />
          </div>
          {/* Overlay for click handling */}
          <div 
            className="absolute inset-0 bg-transparent cursor-pointer"
            onClick={() => handleOpenChange(true)}
            title="Clique para expandir o mapa"
          />
        </div>
      </div>

      {/* Full map dialog with safer mounting/unmounting strategy */}
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
            {/* Only render full map with unique key when dialog is open */}
            {shouldRenderFullMap && (
              <div className="h-full w-full">
                <PanelMap
                  panels={panels}
                  selectedLocation={selectedLocation}
                  onAddToCart={onAddToCart}
                  miniMap={false}
                  instanceId={fullMapKey}
                  key={fullMapKey}
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
