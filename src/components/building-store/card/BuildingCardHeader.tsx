
import React from 'react';
import { MapPin } from 'lucide-react';
import { BuildingStore } from '@/services/buildingStoreService';

interface BuildingCardHeaderProps {
  building: BuildingStore;
}

const BuildingCardHeader: React.FC<BuildingCardHeaderProps> = ({ building }) => {
  return (
    <div className="mb-4">
      <h3 className="text-xl font-bold text-gray-900 mb-1">
        {building.nome}
      </h3>
      <div className="flex items-center text-gray-600 mb-2">
        <MapPin className="h-4 w-4 mr-1" />
        <span className="text-sm">{building.bairro}</span>
      </div>
      <p className="text-gray-600 text-xs">
        {building.endereco}
      </p>
    </div>
  );
};

export default BuildingCardHeader;
