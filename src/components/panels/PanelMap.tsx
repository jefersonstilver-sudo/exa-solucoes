
import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Info } from 'lucide-react';
import { Panel } from '@/types/panel';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PanelMapProps {
  panels: Panel[];
  selectedLocation: {lat: number, lng: number} | null;
  onAddToCart: (panel: Panel, duration?: number) => void;
}

const PanelMap: React.FC<PanelMapProps> = ({ panels, selectedLocation, onAddToCart }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  useEffect(() => {
    // In a real application, you would use a proper map library like Google Maps or Leaflet
    // For demonstration purposes, we'll create a simple visualization
    
    const drawMap = () => {
      if (!mapContainerRef.current) return;
      
      const container = mapContainerRef.current;
      container.innerHTML = '';
      
      const mapElement = document.createElement('div');
      mapElement.className = 'relative w-full h-full bg-gray-100';
      container.appendChild(mapElement);
      
      // Draw pins for all panels that have coordinates
      panels.forEach(panel => {
        if (panel.buildings?.latitude && panel.buildings?.longitude) {
          // Normalize coordinates to fit in our view
          const lat = panel.buildings.latitude;
          const lng = panel.buildings.longitude;
          
          // Calculate position (simplified for demo)
          // In a real map implementation, you would use proper geo positioning
          const x = ((lng + 180) / 360) * 100;
          const y = ((90 - lat) / 180) * 100;
          
          const pin = document.createElement('div');
          pin.className = `absolute w-6 h-6 -ml-3 -mt-3 rounded-full border-2 border-white
                           ${panel.status === 'online' ? 'bg-green-500' : 'bg-amber-500'}
                           flex items-center justify-center text-white cursor-pointer
                           transition-transform hover:scale-110 z-10`;
          pin.style.left = `${x}%`;
          pin.style.top = `${y}%`;
          
          pin.innerHTML = `<span class="text-xs font-bold">${panel.buildings.nome.substring(0, 1)}</span>`;
          
          // Create tooltip when hovering over pin
          const tooltip = document.createElement('div');
          tooltip.className = 'absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white p-3 rounded shadow-lg hidden';
          tooltip.style.width = '200px';
          tooltip.style.zIndex = '20';
          tooltip.innerHTML = `
            <h4 class="font-semibold text-sm">${panel.buildings.nome}</h4>
            <p class="text-xs text-gray-500 mb-2">${panel.buildings.endereco}</p>
            <p class="text-xs mb-1">Status: <span class="font-semibold ${
              panel.status === 'online' ? 'text-green-600' : 'text-amber-600'
            }">${panel.status === 'online' ? 'Ativo' : 'Instalando'}</span></p>
            <button class="text-xs bg-indexa-purple hover:bg-indexa-purple-dark text-white px-2 py-1 rounded w-full">
              Adicionar ao Carrinho
            </button>
          `;
          
          pin.addEventListener('mouseenter', () => {
            tooltip.classList.remove('hidden');
          });
          
          pin.addEventListener('mouseleave', () => {
            tooltip.classList.add('hidden');
          });
          
          pin.addEventListener('click', () => {
            onAddToCart(panel);
          });
          
          pin.appendChild(tooltip);
          mapElement.appendChild(pin);
        }
      });
      
      // Draw selected location pin if available
      if (selectedLocation) {
        const x = ((selectedLocation.lng + 180) / 360) * 100;
        const y = ((90 - selectedLocation.lat) / 180) * 100;
        
        const searchPin = document.createElement('div');
        searchPin.className = 'absolute w-8 h-8 -ml-4 -mt-4 bg-indexa-purple text-white rounded-full flex items-center justify-center z-20';
        searchPin.style.left = `${x}%`;
        searchPin.style.top = `${y}%`;
        searchPin.innerHTML = '<span>📍</span>';
        
        const pulse = document.createElement('div');
        pulse.className = 'absolute w-16 h-16 -ml-8 -mt-8 bg-indexa-purple opacity-20 rounded-full animate-ping';
        pulse.style.left = `${x}%`;
        pulse.style.top = `${y}%`;
        
        mapElement.appendChild(pulse);
        mapElement.appendChild(searchPin);
      }
    };
    
    drawMap();
    
    // Clean up function
    return () => {
      if (mapContainerRef.current) {
        mapContainerRef.current.innerHTML = '';
      }
    };
  }, [panels, selectedLocation, onAddToCart]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'h-full'}`}>
      <div className="absolute top-2 right-2 z-10 flex gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="bg-white" onClick={toggleFullscreen}>
                {isFullscreen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 3v3a2 2 0 0 1-2 2H3"></path>
                    <path d="M21 8h-3a2 2 0 0 1-2-2V3"></path>
                    <path d="M3 16h3a2 2 0 0 1 2 2v3"></path>
                    <path d="M16 21v-3a2 2 0 0 1 2-2h3"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h6v6"></path>
                    <path d="M9 21H3v-6"></path>
                    <path d="M21 3 9 15"></path>
                    <path d="M3 9 15 21"></path>
                  </svg>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isFullscreen ? 'Sair do modo tela cheia' : 'Ver em tela cheia'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="bg-white">
                <Info className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <p>Clique nos marcadores para adicionar o painel ao carrinho. Em uma implementação real, este mapa usaria Google Maps ou Leaflet.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <div ref={mapContainerRef} className="w-full h-full">
        <div className="flex items-center justify-center h-full">
          <div className="text-center p-4">
            <p>Carregando mapa...</p>
          </div>
        </div>
      </div>
      
      {isFullscreen && (
        <Button 
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2"
          onClick={toggleFullscreen}
        >
          Fechar Mapa
        </Button>
      )}
    </div>
  );
};

export default PanelMap;
