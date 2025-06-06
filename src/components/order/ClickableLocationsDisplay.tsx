
import React, { useState } from 'react';
import { MapPin, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useBuildingNames } from '@/hooks/useBuildingNames';

interface ClickableLocationsDisplayProps {
  listaPaineis: string[];
  className?: string;
}

export const ClickableLocationsDisplay: React.FC<ClickableLocationsDisplayProps> = ({
  listaPaineis,
  className = ""
}) => {
  const { buildingNames, loading, error } = useBuildingNames(listaPaineis);
  const [isOpen, setIsOpen] = useState(false);

  console.log('🏢 [CLICKABLE_LOCATIONS] Dados:', {
    listaPaineis,
    buildingNames,
    loading,
    error
  });

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <MapPin className="h-4 w-4 text-gray-400 animate-pulse" />
        <span className="text-gray-500">Carregando locais...</span>
      </div>
    );
  }

  if (error || buildingNames.length === 0) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <MapPin className="h-4 w-4 text-gray-400" />
        <span className="text-gray-500">Locais não encontrados</span>
      </div>
    );
  }

  const firstLocation = buildingNames[0];
  const totalLocations = buildingNames.length;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          className={`flex items-center space-x-2 h-auto p-2 hover:bg-gray-50 ${className}`}
        >
          <MapPin className="h-4 w-4 text-blue-500" />
          <div className="text-left">
            <div className="font-medium text-gray-900">
              {totalLocations === 1 ? firstLocation : `${firstLocation} + ${totalLocations - 1} mais`}
            </div>
            <div className="text-xs text-gray-500 flex items-center">
              <Eye className="h-3 w-3 mr-1" />
              Clique para ver todos
            </div>
          </div>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-blue-500" />
            Locais Contratados ({totalLocations})
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {buildingNames.map((nome, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
              <span className="font-medium text-gray-900">{nome}</span>
            </div>
          ))}
        </div>
        
        <div className="text-sm text-gray-600 mt-4 p-3 bg-blue-50 rounded-lg">
          <strong>Total:</strong> {totalLocations} {totalLocations === 1 ? 'local selecionado' : 'locais selecionados'} para exibição do seu conteúdo.
        </div>
      </DialogContent>
    </Dialog>
  );
};
