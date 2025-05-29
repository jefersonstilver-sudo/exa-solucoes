
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

  const getPadraoColor = (padrao: string) => {
    const colors = {
      alto: 'bg-purple-100 text-purple-800 border-purple-300',
      medio: 'bg-blue-100 text-blue-800 border-blue-300',
      normal: 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return colors[padrao as keyof typeof colors] || colors.normal;
  };

  const primaryImage = getImageUrl(building.imagem_principal);
  const imageUrls = getBuildingImageUrls(building);
  const totalImages = imageUrls.length;

  return (
    <div className="relative w-full h-72 lg:h-80">
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
      
      {/* Badges no topo da imagem */}
      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
        <Badge className={`${getPadraoColor(building.padrao_publico)} text-xs px-2 py-1`}>
          {building.padrao_publico.charAt(0).toUpperCase() + building.padrao_publico.slice(1)}
        </Badge>
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
