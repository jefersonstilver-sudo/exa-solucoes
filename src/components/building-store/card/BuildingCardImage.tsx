
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Building2, Camera } from 'lucide-react';
import { BuildingStore, getBuildingImageUrls, getImageUrl } from '@/services/buildingStoreService';

interface BuildingCardImageProps {
  building: BuildingStore;
  mode?: 'square' | 'fill';
}

const BuildingCardImage: React.FC<BuildingCardImageProps> = ({ building, mode = 'square' }) => {

  const primaryImage = getImageUrl(building.imagem_principal);
  const imageUrls = getBuildingImageUrls(building);
  const totalImages = imageUrls.length;
  
  // Verificar se é PRE VENDA (status instalação)
  const isPreVenda = building.status?.toLowerCase() === 'instalação' || building.status?.toLowerCase() === 'instalacao';
  
  // Debug do status
  console.log(`🏗️ [PRE-VENDA] Prédio: ${building.nome}, Status: "${building.status}", É Pre-Venda: ${isPreVenda}`);

  return (
    <div className={mode === 'fill' ? "relative w-full h-full min-h-[280px]" : "relative w-full aspect-square"}>
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
      
      {/* Tarja PRE VENDA - Canto superior direito */}
      {isPreVenda && (
        <div className="absolute top-3 right-3 z-20">
          <div className="bg-blue-600 text-white px-3 py-1.5 text-sm font-bold tracking-wide shadow-lg rounded-md border border-blue-700">
            PRÉ-VENDA
          </div>
        </div>
      )}
      
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
