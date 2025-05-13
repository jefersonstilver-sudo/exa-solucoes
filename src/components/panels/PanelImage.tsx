
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Monitor } from 'lucide-react';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PanelImageProps {
  imageUrl: string;
  altText: string;
  status: string;
  lastSync: Date;
  mode: string;
  resolution: string;
  screenCount: number;
}

export const PanelImage: React.FC<PanelImageProps> = ({
  imageUrl,
  altText,
  status,
  lastSync,
  mode,
  resolution,
  screenCount
}) => {
  const lastSyncFormatted = formatDistanceToNow(lastSync, { addSuffix: true, locale: ptBR });

  return (
    <div className="relative h-64 w-full">
      <img 
        src={imageUrl || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab'} 
        alt={altText || 'Building image'}
        className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
      />
      
      {/* Status indicator - top right */}
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="absolute top-4 right-4 bg-white rounded-full shadow-md px-3 py-1.5 flex items-center gap-1.5 cursor-help">
              <span className={`w-2.5 h-2.5 rounded-full ${status === 'online' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
              <span className="text-xs font-medium text-gray-800">
                {status === 'online' ? 'Ativo' : 'Em instalação'}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Última atualização: {lastSyncFormatted}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Mode and resolution - bottom left */}
      <div className="absolute bottom-4 left-4 flex gap-2">
        <Badge variant="secondary" className="bg-white/90 text-gray-800 shadow-sm">
          {mode.charAt(0).toUpperCase() + mode.slice(1)}
        </Badge>
        <Badge variant="secondary" className="bg-white/90 text-gray-800 shadow-sm">
          {resolution}
        </Badge>
        <Badge variant="secondary" className="bg-white/90 text-gray-800 shadow-sm flex items-center gap-1">
          <Monitor className="h-3 w-3" /> {screenCount} {screenCount === 1 ? 'Tela' : 'Telas'}
        </Badge>
      </div>
    </div>
  );
};
