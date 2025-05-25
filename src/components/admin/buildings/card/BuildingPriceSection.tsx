
import React from 'react';
import { DollarSign } from 'lucide-react';

interface BuildingPriceSectionProps {
  building: any;
}

const BuildingPriceSection: React.FC<BuildingPriceSectionProps> = ({ building }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <div className="mb-4">
      <div className="flex items-center space-x-2">
        <DollarSign className="h-4 w-4 text-green-600" />
        <span className="text-xl font-bold text-green-600">
          {formatPrice(building.preco_base)}
        </span>
        <span className="text-sm text-gray-500">preço base</span>
      </div>
    </div>
  );
};

export default BuildingPriceSection;
