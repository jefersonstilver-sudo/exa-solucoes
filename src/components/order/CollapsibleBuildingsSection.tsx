import React, { useState } from 'react';
import { ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { SelectedBuildingsSection } from './SelectedBuildingsSection';

interface CollapsibleBuildingsSectionProps {
  listaPredios: string[];
}

export const CollapsibleBuildingsSection: React.FC<CollapsibleBuildingsSectionProps> = ({
  listaPredios
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <Card 
        className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-xl shadow-sm cursor-pointer hover:shadow-md transition-all" 
        onClick={() => setIsOpen(true)}
      >
        <CardHeader className="p-2 sm:p-3">
          <CardTitle className="flex items-center justify-between text-xs sm:text-sm">
            <span className="flex items-center gap-1.5 sm:gap-2">
              <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Locais Selecionados ({listaPredios.length})
            </span>
            <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <div 
        className="flex items-center justify-between p-2 bg-muted/50 rounded cursor-pointer"
        onClick={() => setIsOpen(false)}
      >
        <span className="text-xs sm:text-sm font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Locais Selecionados ({listaPredios.length})
        </span>
        <ChevronUp className="h-4 w-4 text-muted-foreground" />
      </div>
      <SelectedBuildingsSection listaPredios={listaPredios} />
    </div>
  );
};
