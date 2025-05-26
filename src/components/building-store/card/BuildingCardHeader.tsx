
import React from 'react';
import { MapPin } from 'lucide-react';
import { BuildingStore } from '@/services/buildingStoreService';

interface BuildingCardHeaderProps {
  building: BuildingStore;
}

const BuildingCardHeader: React.FC<BuildingCardHeaderProps> = ({ building }) => {
  return (
    <div className="mb-6">
      <h3 className="text-2xl font-bold text-gray-900 mb-2">
        {building.nome}
      </h3>
      <div className="flex items-center text-gray-600 mb-4">
        <MapPin className="h-5 w-5 mr-2" />
        <span className="text-base">{building.bairro}</span>
      </div>
      <p className="text-gray-600 text-sm">
        {building.endereco}
      </p>
    </div>
  );
};

export default BuildingCardHeader;
