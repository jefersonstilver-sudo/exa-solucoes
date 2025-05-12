
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Array of amenities for display
const amenities = [
  { icon: '🏋️', name: 'Academia' },
  { icon: '🏊', name: 'Piscina' },
  { icon: '🎉', name: 'Salão de Festas' },
  { icon: '🐶', name: 'Pet Place' },
  { icon: '🥩', name: 'Área de Churrasqueira' },
  { icon: '🧒', name: 'Playground' }
];

interface AmenityListProps {
  randomCount?: number; // Optional: for random generation in demo mode
}

export const AmenityList: React.FC<AmenityListProps> = ({ randomCount }) => {
  // Generate random amenities for each panel
  const getRandomAmenities = () => {
    const shuffled = [...amenities].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, randomCount || Math.floor(Math.random() * 6) + 2); // 2-6 amenities
  };
  
  const displayAmenities = randomCount ? getRandomAmenities() : amenities;
  
  return (
    <div className="mb-6">
      <h4 className="text-sm font-medium text-gray-500 mb-2">Comodidades do condomínio:</h4>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {displayAmenities.map((amenity, idx) => (
          <TooltipProvider key={idx}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant="outline" 
                  className="flex items-center gap-1.5 py-1.5 px-3 whitespace-nowrap border-gray-200 bg-gray-50"
                >
                  <span>{amenity.icon}</span>
                  <span>{amenity.name}</span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>{amenity.name}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </div>
  );
};
