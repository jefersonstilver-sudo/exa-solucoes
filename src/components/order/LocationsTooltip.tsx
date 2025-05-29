
import React from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useBuildingNames } from '@/hooks/useBuildingNames';

interface LocationsTooltipProps {
  listaPaineis: string[];
  children: React.ReactNode;
}

export const LocationsTooltip: React.FC<LocationsTooltipProps> = ({
  listaPaineis,
  children
}) => {
  const { buildingNames, loading, error } = useBuildingNames(listaPaineis);

  console.log('🎯 [LOCATIONS_TOOLTIP] Renderizando com:', {
    listaPaineis,
    buildingNames,
    loading,
    error
  });

  const getTooltipContent = () => {
    if (loading) {
      return (
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Carregando locais...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-red-400">
          {error}
        </div>
      );
    }

    if (buildingNames.length === 0) {
      return (
        <div className="text-gray-400">
          Nenhum local selecionado
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center space-x-2 mb-2">
          <MapPin className="h-4 w-4 text-blue-400" />
          <span className="font-medium text-white">
            {buildingNames.length === 1 ? 'Local de Exibição:' : 'Locais de Exibição:'}
          </span>
        </div>
        <div className="space-y-1">
          {buildingNames.map((nome, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0" />
              <span className="text-gray-200">{nome}</span>
            </div>
          ))}
        </div>
        <div className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-600">
          {buildingNames.length} {buildingNames.length === 1 ? 'prédio selecionado' : 'prédios selecionados'}
        </div>
      </div>
    );
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="bg-gray-800 border-gray-700 text-white max-w-xs p-3"
          sideOffset={8}
        >
          {getTooltipContent()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
