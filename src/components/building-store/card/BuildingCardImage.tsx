
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Building2, Camera } from 'lucide-react';
import { BuildingStore, getBuildingImageUrls } from '@/services/buildingStoreService';
import { supabase } from '@/integrations/supabase/client';

interface BuildingCardImageProps {
  building: BuildingStore;
}

const BuildingCardImage: React.FC<BuildingCardImageProps> = ({ building }) => {
  const getImageUrl = (path: string) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${supabase.storage.from('building-images').getPublicUrl(path).data.publicUrl}`;
  };

  const primaryImage = getImageUrl(building.imagem_principal);
  const imageUrls = getBuildingImageUrls(building);
  const totalImages = imageUrls.length;

  return (
    <div className="relative w-full aspect-square">
      {primaryImage ? (
        <img
          src={primaryImage}
          alt={building.nome}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indexa-purple/10 to-indexa-purple/5">
          <Building2 className="h-16 w-16 text-indexa-purple/30" />
        </div>
      )}
      
      {/* Badge apenas para venue_type - removido o badge de padrão público */}
      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
        <Badge className="bg-indigo-500/90 text-white border-0 text-xs px-2 py-1">
          {building.venue_type || 'Residencial'}
        </Badge>
      </div>
      
      {/* Contador de fotos */}
      {totalImages > 0 && (
        <div className="absolute bottom-3 left-3 flex items-center bg-black/60 text-white px-2 py-1 rounded-lg">
          <Camera className="h-3 w-3 mr-1" />
          <span className="text-xs font-medium">{totalImages} fotos</span>
        </div>
      )}
    </div>
  );
};

export default BuildingCardImage;
