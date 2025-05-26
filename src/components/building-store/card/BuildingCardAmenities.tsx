
import React from 'react';
import { 
  Star,
  Wifi,
  Car,
  Shield,
  Gamepad2,
  Dumbbell
} from 'lucide-react';
import { BuildingStore } from '@/services/buildingStoreService';

interface BuildingCardAmenitiesProps {
  building: BuildingStore;
}

const BuildingCardAmenities: React.FC<BuildingCardAmenitiesProps> = ({ building }) => {
  const getAmenityIcon = (amenity: string) => {
    const iconMap: Record<string, any> = {
      'wifi': Wifi,
      'estacionamento': Car,
      'seguranca': Shield,
      'area_lazer': Gamepad2,
      'academia': Dumbbell,
    };
    return iconMap[amenity.toLowerCase()] || Star;
  };

  if (!building.amenities || building.amenities.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <p className="text-sm font-semibold text-gray-700 mb-3">Comodidades disponíveis:</p>
      <div className="flex flex-wrap gap-2">
        {building.amenities.slice(0, 6).map((amenity, index) => {
          const IconComponent = getAmenityIcon(amenity);
          return (
            <div
              key={index}
              className="flex items-center bg-gray-100 hover:bg-gray-200 transition-colors px-3 py-2 rounded-full"
            >
              <IconComponent className="h-4 w-4 mr-2 text-gray-600" />
              <span className="text-sm text-gray-700 capitalize">
                {amenity.replace('_', ' ')}
              </span>
            </div>
          );
        })}
        {building.amenities.length > 6 && (
          <span className="text-sm text-gray-500 px-3 py-2 bg-gray-50 rounded-full">
            +{building.amenities.length - 6} mais
          </span>
        )}
      </div>
    </div>
  );
};

export default BuildingCardAmenities;
