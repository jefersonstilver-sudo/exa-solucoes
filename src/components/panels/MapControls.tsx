
import React from 'react';
import { Maximize, Minimize, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MapControlsProps {
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  miniMap: boolean;
}

const MapControls: React.FC<MapControlsProps> = ({ 
  isFullscreen, 
  toggleFullscreen, 
  miniMap 
}) => {
  return (
    <div className="absolute top-2 right-2 z-10 flex gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" className="bg-white" onClick={toggleFullscreen}>
              {isFullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isFullscreen ? 'Sair do modo tela cheia' : 'Ver em tela cheia'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {!miniMap && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="bg-white">
                <Info className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <p>Clique nos marcadores para adicionar o painel ao carrinho.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};

export default MapControls;
