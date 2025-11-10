
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Building2, Camera, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface BuildingImageSectionProps {
  building: any;
}

const BuildingImageSection: React.FC<BuildingImageSectionProps> = ({ building }) => {
  const getImageUrl = (path: string) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${supabase.storage.from('building-images').getPublicUrl(path).data.publicUrl}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo':
        return (
          <Badge className="bg-green-50 text-green-700 border border-green-200">
            Ativo
          </Badge>
        );
      case 'inativo':
        return (
          <Badge className="bg-gray-50 text-gray-700 border border-gray-200">
            Inativo
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-white/90">
            {status}
          </Badge>
        );
    }
  };

  const getPadraoPublicoBadge = (padrao: string) => {
    const styles = {
      alto: 'bg-red-50 text-red-700 border border-red-200',
      medio: 'bg-blue-50 text-blue-700 border border-blue-200',
      normal: 'bg-gray-50 text-gray-700 border border-gray-200'
    };
    
    return (
      <Badge className={styles[padrao as keyof typeof styles] || styles.normal}>
        {padrao.charAt(0).toUpperCase() + padrao.slice(1)}
      </Badge>
    );
  };

  const getVenueTypeBadge = (venueType: string) => {
    return (
      <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200">
        {venueType || 'Residencial'}
      </Badge>
    );
  };

  const primaryImage = getImageUrl(building.imagem_principal);
  const totalImages = [building.imagem_principal, building.imagem_2, building.imagem_3, building.imagem_4].filter(Boolean).length;

  return (
    <div className="relative w-full md:w-2/5 h-48 md:h-auto bg-gradient-to-br from-[#9C1E1E]/10 to-[#9C1E1E]/5">
      {primaryImage ? (
        <img
          src={primaryImage}
          alt={building.nome}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Building2 className="h-16 w-16 text-[#9C1E1E]/30" />
        </div>
      )}
      
      {/* Badges sobrepostos */}
      <div className="absolute top-3 left-3 flex flex-col gap-2">
        {getStatusBadge(building.status)}
        {getVenueTypeBadge(building.venue_type)}
      </div>
      
      <div className="absolute top-3 right-3">
        {getPadraoPublicoBadge(building.padrao_publico)}
      </div>
      
      {/* Indicador de fotos */}
      {totalImages > 0 && (
        <div className="absolute bottom-3 left-3 flex items-center space-x-1">
          <Camera className="h-4 w-4 text-white" />
          <span className="text-white text-sm font-medium bg-black/50 px-2 py-1 rounded">
            {totalImages} foto{totalImages !== 1 ? 's' : ''}
          </span>
          {building.imagem_principal && (
            <Star className="h-4 w-4 text-yellow-400" />
          )}
        </div>
      )}
    </div>
  );
};

export default BuildingImageSection;
