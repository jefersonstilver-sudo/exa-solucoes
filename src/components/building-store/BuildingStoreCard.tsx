
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Users, Eye, Star, Building2 } from 'lucide-react';
import { BuildingStore } from '@/services/buildingStoreService';
import { formatCurrency } from '@/utils/priceUtils';

interface BuildingStoreCardProps {
  building: BuildingStore;
  onViewPanels: (building: BuildingStore) => void;
}

const BuildingStoreCard: React.FC<BuildingStoreCardProps> = ({ 
  building, 
  onViewPanels 
}) => {
  // Valores padrão para dados ausentes
  const publicoEstimado = building.publico_estimado || 1200;
  const visualizacoesMes = building.visualizacoes_mes || Math.floor(publicoEstimado * 0.8);
  const precoBase = building.preco_base || 280;
  const quantidadeTelas = building.quantidade_telas || 1;
  
  // Formatação da distância
  const distanceText = 'distance' in building && building.distance 
    ? `${(building.distance / 1000).toFixed(1)}km`
    : '';

  // Imagem principal com fallback
  const imageUrl = building.imagem_principal || 
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80';

  // Badge do tipo de local
  const getVenueTypeBadge = (type: string) => {
    const colors = {
      'Residencial': 'bg-blue-100 text-blue-800',
      'Comercial': 'bg-green-100 text-green-800',
      'Misto': 'bg-purple-100 text-purple-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // Badge do padrão do público
  const getStandardBadge = (standard: string) => {
    const standards = {
      'alto': { label: 'Alto Padrão', color: 'bg-yellow-100 text-yellow-800' },
      'medio': { label: 'Médio Padrão', color: 'bg-orange-100 text-orange-800' },
      'normal': { label: 'Padrão Normal', color: 'bg-gray-100 text-gray-800' }
    };
    return standards[standard as keyof typeof standards] || standards.normal;
  };

  const standardInfo = getStandardBadge(building.padrao_publico || 'normal');

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md overflow-hidden bg-white">
      {/* Header da imagem */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={imageUrl}
          alt={building.nome}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            // Fallback para imagem padrão se a original falhar
            e.currentTarget.src = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80';
          }}
        />
        
        {/* Badges sobrepostos */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <Badge className={getVenueTypeBadge(building.venue_type)}>
            <Building2 className="h-3 w-3 mr-1" />
            {building.venue_type}
          </Badge>
          
          <Badge className={standardInfo.color}>
            <Star className="h-3 w-3 mr-1" />
            {standardInfo.label}
          </Badge>
        </div>

        {/* Distância (se disponível) */}
        {distanceText && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-black/70 text-white">
              <MapPin className="h-3 w-3 mr-1" />
              {distanceText}
            </Badge>
          </div>
        )}

        {/* Número de telas */}
        <div className="absolute bottom-3 right-3">
          <Badge className="bg-[#3C1361] text-white">
            {quantidadeTelas} {quantidadeTelas === 1 ? 'tela' : 'telas'}
          </Badge>
        </div>
      </div>

      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold text-[#3C1361] group-hover:text-[#3C1361]/80 transition-colors">
          {building.nome}
        </CardTitle>
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
          <span className="truncate">
            {building.endereco}, {building.bairro}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Métricas principais */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <Users className="h-4 w-4 text-[#3C1361] mr-1" />
            </div>
            <div className="text-lg font-bold text-[#3C1361]">
              {publicoEstimado.toLocaleString()}
            </div>
            <div className="text-xs text-gray-600">Público/mês</div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <Eye className="h-4 w-4 text-[#3C1361] mr-1" />
            </div>
            <div className="text-lg font-bold text-[#3C1361]">
              {visualizacoesMes.toLocaleString()}
            </div>
            <div className="text-xs text-gray-600">Visualizações</div>
          </div>
        </div>

        {/* Preço */}
        <div className="text-center p-4 bg-gradient-to-r from-[#3C1361]/5 to-[#3C1361]/10 rounded-lg border border-[#3C1361]/20">
          <div className="text-sm text-gray-600 mb-1">A partir de</div>
          <div className="text-2xl font-bold text-[#3C1361]">
            {formatCurrency(precoBase)}
          </div>
          <div className="text-xs text-gray-500">por mês</div>
        </div>

        {/* Comodidades (primeiras 3) */}
        {building.amenities && building.amenities.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">Comodidades:</div>
            <div className="flex flex-wrap gap-1">
              {building.amenities.slice(0, 3).map((amenity, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {amenity}
                </Badge>
              ))}
              {building.amenities.length > 3 && (
                <Badge variant="outline" className="text-xs text-gray-500">
                  +{building.amenities.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Botão de ação */}
        <Button
          onClick={() => onViewPanels(building)}
          className="w-full bg-[#3C1361] hover:bg-[#3C1361]/90 text-white font-medium"
          size="lg"
        >
          Ver Painéis Disponíveis
        </Button>
      </CardContent>
    </Card>
  );
};

export default BuildingStoreCard;
