
import React from 'react';
import { MapPin } from 'lucide-react';

interface BuildingHeaderProps {
  building: any;
}

const BuildingHeader: React.FC<BuildingHeaderProps> = ({ building }) => {
  return (
    <div className="mb-4">
      <h3 className="text-xl font-bold text-gray-900 mb-2">{building.nome}</h3>
      <div className="flex items-start space-x-2 text-gray-600">
        <MapPin className="h-4 w-4 mt-1 flex-shrink-0" />
        <div>
          <div className="font-medium">{building.bairro}</div>
          <div className="text-sm opacity-75">{building.endereco}</div>
        </div>
      </div>
    </div>
  );
};

export default BuildingHeader;
