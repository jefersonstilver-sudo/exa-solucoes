
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
  
  // Montar/desmontar o mapa completo baseado no estado do diálogo
  useEffect(() => {
    if (open) {
      // Permitir um pequeno atraso para montar o mapa completo
      // após a animação do diálogo iniciar
      const timer = setTimeout(() => {
        setIsFullMapMounted(true);
      }, 100);
      
      return () => clearTimeout(timer);
    } else {
      // Dar tempo para o diálogo fechar antes de desmontar o mapa completo
      const timer = setTimeout(() => {
        setIsFullMapMounted(false);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [open]);
  
  // Controlador de abertura do diálogo
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
          {isMiniMapMounted && (
            <PanelMap
              panels={panels}
              selectedLocation={selectedLocation}
              onAddToCart={onAddToCart}
              miniMap={true}
            />
          )}
          <div 
            className="absolute inset-0 bg-transparent cursor-pointer"
            onClick={() => setOpen(true)}
            title="Clique para expandir o mapa"
          />
        </div>
      </div>

      {/* Usar Dialog para o mapa completo */}
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
            {/* Renderizar o mapa completo apenas quando o diálogo estiver aberto e o componente montado */}
            {open && isFullMapMounted && (
              <PanelMap
                panels={panels}
                selectedLocation={selectedLocation}
                onAddToCart={onAddToCart}
                miniMap={false}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MiniMap;
