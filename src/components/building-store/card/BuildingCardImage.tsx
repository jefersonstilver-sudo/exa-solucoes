
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
    <div className="relative lg:w-2/5 h-64 lg:h-80">
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
      <div className="absolute top-4 left-4 flex flex-wrap gap-2">
        <Badge className={getPadraoColor(building.padrao_publico)}>
          {building.padrao_publico.charAt(0).toUpperCase() + building.padrao_publico.slice(1)}
        </Badge>
        <Badge className="bg-indigo-500/90 text-white border-0">
          {building.venue_type || 'Residencial'}
        </Badge>
      </div>
      
      {/* Contador de fotos */}
      {totalImages > 0 && (
        <div className="absolute bottom-4 left-4 flex items-center bg-black/60 text-white px-3 py-2 rounded-lg">
          <Camera className="h-4 w-4 mr-2" />
          <span className="text-sm font-medium">{totalImages} fotos</span>
        </div>
      )}
    </div>
  );
};

export default BuildingCardImage;
