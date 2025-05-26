
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Users, 
  Eye, 
  Camera,
  Star,
  Building2,
  Wifi,
  Car,
  Shield,
  Gamepad2,
  Dumbbell
} from 'lucide-react';
import { motion } from 'framer-motion';
import { BuildingStore, getBuildingImageUrls } from '@/services/buildingStoreService';
import { supabase } from '@/integrations/supabase/client';

interface BuildingStoreCardProps {
  building: BuildingStore;
  onViewPanels: (building: BuildingStore) => void;
}

const BuildingStoreCard: React.FC<BuildingStoreCardProps> = ({ 
  building, 
  onViewPanels 
}) => {
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

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}K`;
    }
    return num.toString();
  };

  const primaryImage = getImageUrl(building.imagem_principal);
  const imageUrls = getBuildingImageUrls(building);
  const totalImages = imageUrls.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-white">
        <div className="relative">
          {/* Imagem Principal */}
          <div className="relative h-64 bg-gradient-to-br from-indexa-purple/10 to-indexa-purple/5">
            {primaryImage ? (
              <img
                src={primaryImage}
                alt={building.nome}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Building2 className="h-16 w-16 text-indexa-purple/30" />
              </div>
            )}
            
            {/* Badge de Padrão */}
            <div className="absolute top-4 left-4">
              <Badge className={getPadraoColor(building.padrao_publico)}>
                {building.padrao_publico.charAt(0).toUpperCase() + building.padrao_publico.slice(1)}
              </Badge>
            </div>
            
            {/* Badge de Tipo */}
            <div className="absolute top-4 right-4">
              <Badge className="bg-indigo-500/90 text-white border-0">
                {building.venue_type || 'Residencial'}
              </Badge>
            </div>
            
            {/* Contador de fotos */}
            {totalImages > 0 && (
              <div className="absolute bottom-4 left-4 flex items-center bg-black/60 text-white px-2 py-1 rounded-lg">
                <Camera className="h-3 w-3 mr-1" />
                <span className="text-xs">{totalImages}</span>
              </div>
            )}
          </div>
        </div>

        <CardContent className="p-6">
          {/* Nome e Localização */}
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {building.nome}
            </h3>
            <div className="flex items-center text-gray-600 mb-3">
              <MapPin className="h-4 w-4 mr-1" />
              <span className="text-sm">{building.bairro}</span>
            </div>
          </div>

          {/* Métricas Principais */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center mb-1">
                <Users className="h-4 w-4 text-blue-600 mr-1" />
                <span className="text-xs text-blue-600 font-medium">Público</span>
              </div>
              <p className="text-lg font-bold text-blue-900">
                {formatNumber(building.publico_estimado)}
              </p>
            </div>
            
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-center mb-1">
                <Eye className="h-4 w-4 text-green-600 mr-1" />
                <span className="text-xs text-green-600 font-medium">Views/mês</span>
              </div>
              <p className="text-lg font-bold text-green-900">
                {formatNumber(building.visualizacoes_mes)}
              </p>
            </div>
          </div>

          {/* Amenities */}
          {building.amenities && building.amenities.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Comodidades:</p>
              <div className="flex flex-wrap gap-2">
                {building.amenities.slice(0, 4).map((amenity, index) => {
                  const IconComponent = getAmenityIcon(amenity);
                  return (
                    <div
                      key={index}
                      className="flex items-center bg-gray-100 px-2 py-1 rounded-full"
                    >
                      <IconComponent className="h-3 w-3 mr-1 text-gray-600" />
                      <span className="text-xs text-gray-700 capitalize">
                        {amenity.replace('_', ' ')}
                      </span>
                    </div>
                  );
                })}
                {building.amenities.length > 4 && (
                  <span className="text-xs text-gray-500 px-2 py-1">
                    +{building.amenities.length - 4} mais
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Preço e Painéis */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <p className="text-sm text-gray-600">A partir de</p>
              <p className="text-2xl font-bold text-indexa-purple">
                R$ {building.preco_base || 280}
                <span className="text-sm font-normal text-gray-500">/mês</span>
              </p>
              <p className="text-xs text-gray-500">
                {building.quantidade_telas} painel{building.quantidade_telas !== 1 ? 'éis' : ''} disponível{building.quantidade_telas !== 1 ? 'eis' : ''}
              </p>
            </div>
            
            <Button
              onClick={() => onViewPanels(building)}
              className="bg-indexa-purple hover:bg-indexa-purple-dark text-white px-6 py-2"
            >
              Ver Painéis
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default BuildingStoreCard;
