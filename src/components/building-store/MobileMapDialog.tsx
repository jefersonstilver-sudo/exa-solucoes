import React, { useState, useEffect } from 'react';
import { Map, Maximize2, Minimize2, Navigation, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import BuildingMap from './BuildingMap';
import MobileBuildingInfoCard from './MobileBuildingInfoCard';
import useBuildingStore from '@/hooks/building-store/useBuildingStore';
import { BuildingStore } from '@/services/buildingStoreService';

interface MobileMapDialogProps {
  buildingsCount: number;
  className?: string;
}

const MobileMapDialog: React.FC<MobileMapDialogProps> = ({ buildingsCount, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingStore | null>(null);
  const { buildings, selectedLocation } = useBuildingStore();

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className={`flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 text-blue-700 hover:from-blue-100 hover:to-indigo-100 hover:border-blue-400 transition-all duration-200 rounded-lg justify-center ${className}`}
        >
          <Map className="h-4 w-4" />
          <span className="font-medium text-sm">Mapa</span>
          {buildingsCount > 0 && (
            <Badge variant="secondary" className="bg-blue-600 text-white text-xs font-bold h-5 px-2">
              {buildingsCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent 
        className={`p-0 border-0 bg-transparent shadow-none ${
          isFullscreen 
            ? 'max-w-[100vw] w-[100vw] max-h-[100vh] h-[100vh] rounded-none' 
            : 'max-w-[95vw] w-[95vw] max-h-[85vh] h-[80vh] rounded-lg'
        } transition-all duration-300 ease-in-out`}
      >
        <div className="w-full h-full bg-white rounded-lg shadow-2xl flex flex-col min-h-0 overflow-visible">
          {/* Header */}
          <DialogHeader className="p-4 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center space-x-2 text-lg font-semibold">
                <Navigation className="h-5 w-5" />
                <span>Mapa Interativo</span>
                {buildingsCount > 0 && (
                  <Badge variant="secondary" className="bg-white/20 text-white text-sm">
                    {buildingsCount} {buildingsCount === 1 ? 'prédio' : 'prédios'}
                  </Badge>
                )}
              </DialogTitle>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="text-white hover:bg-white/20 p-2"
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20 p-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Map Content */}
          <div className="flex-1 min-h-0 bg-gray-100 overflow-visible">
            <div className="w-full h-full relative overflow-visible">
              {buildings && buildings.length > 0 ? (
                <BuildingMap 
                  buildings={buildings} 
                  selectedLocation={selectedLocation} 
                  scrollwheel={true} 
                  defaultZoom={isFullscreen ? 15 : 13}
                  enableClustering={true}
                  requirePreciseGeocode={false}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-50">
                  <div className="text-center p-8">
                    <Map className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">
                      Nenhum prédio encontrado
                    </h3>
                    <p className="text-gray-500 text-sm">
                      Ajuste os filtros para visualizar prédios no mapa
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer with instructions */}
          {isOpen && (
            <div className="p-3 bg-gray-50 border-t">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span className="flex items-center space-x-1">
                  <Navigation className="h-3 w-3" />
                  <span>Toque nos marcadores para mais detalhes</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Maximize2 className="h-3 w-3" />
                  <span>Modo {isFullscreen ? 'tela cheia' : 'janela'}</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Building Info Card */}
        {selectedBuilding && (
          <MobileBuildingInfoCard 
            building={selectedBuilding}
            onClose={handleCloseBuildingCard}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MobileMapDialog;