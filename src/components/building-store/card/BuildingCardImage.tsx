
import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Building2, Camera } from 'lucide-react';
import { BuildingStore, getBuildingImageUrls, getImageUrl } from '@/services/buildingStoreService';
import { calculateDistanceToBuilding, formatDistance } from '@/services/distanceCalculation';
import useBuildingStore from '@/hooks/building-store/useBuildingStore';

interface BuildingCardImageProps {
  building: BuildingStore;
  mode?: 'square' | 'fill';
}

const BuildingCardImage: React.FC<BuildingCardImageProps> = ({ building, mode = 'square' }) => {
  const businessLocation = useBuildingStore(s => s.businessLocation);
  const primaryImage = getImageUrl(building.imagem_principal);
  const imageUrls = getBuildingImageUrls(building);
  const totalImages = imageUrls.length;
  
  // Calcular distância se houver localização do negócio
  const distance = businessLocation ? calculateDistanceToBuilding(businessLocation, building as any) : null;

  return (
    <div className={mode === 'fill' ? "relative w-full h-full overflow-hidden" : "relative w-full aspect-[16/10] overflow-hidden"}>
      {primaryImage ? (
        <img
          src={primaryImage}
          alt={building.nome}
          className="w-full h-full object-cover object-center"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <Building2 className="h-16 w-16 text-gray-300" />
        </div>
      )}
      
      {/* Badges na imagem - esquerda */}
      <div className="absolute top-3 left-3 flex gap-1.5">
        {/* Tipo do local */}
        <span className="bg-white/95 text-gray-900 px-2 py-1 rounded text-xs font-medium shadow-sm">
          {building.venue_type || 'Residencial'}
        </span>
        
        {/* Digital badge */}
        <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium shadow-sm">
          Digital
        </span>
      </div>
      
      {/* Distância - canto superior direito */}
      {distance && (
        <div className="absolute top-3 right-3">
          <span className="bg-white/95 text-gray-900 px-2 py-1 rounded text-xs font-medium shadow-sm">
            {distance}
          </span>
        </div>
      )}
      
      {/* Contador de fotos - canto inferior esquerdo */}
      {totalImages > 0 && (
        <div className="absolute bottom-3 left-3 flex items-center bg-black/70 text-white px-2 py-1 rounded">
          <Camera className="h-3 w-3 mr-1" />
          <span className="text-xs font-medium">{totalImages}</span>
        </div>
      )}
    </div>
  );
};

export default BuildingCardImage;
