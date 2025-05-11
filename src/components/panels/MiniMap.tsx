
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
  const [miniMapKey, setMiniMapKey] = useState(`mini-${Math.random().toString(36).substring(2, 9)}`);
  const [fullMapKey, setFullMapKey] = useState(`full-${Math.random().toString(36).substring(2, 9)}`);
  const [shouldRenderMiniMap, setShouldRenderMiniMap] = useState(true);
  const [shouldRenderFullMap, setShouldRenderFullMap] = useState(false);
  
  // Handle dialog state changes to prevent DOM manipulation conflicts
  useEffect(() => {
    // When dialog opens, prepare to show full map
    if (open) {
      // Small delay to ensure dialog animation starts first
      const timer = setTimeout(() => {
        setShouldRenderFullMap(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      // When dialog closes, wait for animation to complete before unmounting
      const timer = setTimeout(() => {
        setShouldRenderFullMap(false);
        // Generate new key for full map when closed to ensure clean remount
        setFullMapKey(`full-${Math.random().toString(36).substring(2, 9)}`);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Regenerate mini map on component remount
  useEffect(() => {
    // Generate fresh IDs on mount to avoid stale references
    setMiniMapKey(`mini-${Math.random().toString(36).substring(2, 9)}`);
    setFullMapKey(`full-${Math.random().toString(36).substring(2, 9)}`);
    
    return () => {
      // Ensure maps are unmounted during component cleanup
      setShouldRenderMiniMap(false);
      setShouldRenderFullMap(false);
    };
  }, []);
  
  // Dialog open handler with safety
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
          {/* Only render mini map when needed with unique key */}
          {shouldRenderMiniMap && (
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
          )}
          {/* Overlay for click handling */}
          <div 
            className="absolute inset-0 bg-transparent cursor-pointer"
            onClick={() => setOpen(true)}
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
            {open && shouldRenderFullMap && (
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
