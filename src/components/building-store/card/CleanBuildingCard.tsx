
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Building2, Users } from 'lucide-react';
import { BuildingStore, buildingToPanel } from '@/services/buildingStoreService';
import ModernAddToCartButton from './ModernAddToCartButton';

interface CleanBuildingCardProps {
  building: BuildingStore;
  onAddToCart: (panel: any, duration?: number) => void;
}

const CleanBuildingCard: React.FC<CleanBuildingCardProps> = ({ 
  building, 
  onAddToCart 
}) => {
  // Convert Building to Panel
  const panel = buildingToPanel(building);
  
  // Calculate estimated data
  const estimatedResidents = Math.floor(Math.random() * 800) + 200;
  const isCommercial = building.padrao_publico === 'alto'; // Usando 'alto' ao invés de 'comercial'
  
  const containerVariants = {
    hover: { 
      y: -8,
      boxShadow: "0 25px 50px -12px rgba(60, 19, 97, 0.25)",
      transition: { duration: 0.3 }
    }
  };

  // URL da imagem padrão se não houver imagem
  const defaultImageUrl = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab';
  const buildingImage = defaultImageUrl; // Usando imagem padrão por enquanto

  return (
    <motion.div 
      variants={containerVariants}
      whileHover="hover"
      className="w-full h-full"
    >
      <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl rounded-2xl h-full bg-white">
        <CardContent className="p-0 h-full flex flex-col">
          {/* Image Section */}
          <div className="relative h-48 overflow-hidden">
            <img 
              src={buildingImage}
              alt={building.nome} 
              className="w-full h-full object-cover"
            />
            
            {/* Building Type Badge */}
            <div className="absolute top-4 left-4">
              <Badge className="bg-[#3C1361]/90 text-white border-0 rounded-full px-3 py-1">
                {isCommercial ? 'Comercial' : 'Residencial'}
              </Badge>
            </div>
          </div>
          
          {/* Content Section */}
          <div className="p-6 flex-1 flex flex-col">
            {/* Building Name */}
            <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">
              {building.nome}
            </h3>
            
            {/* Location */}
            <div className="flex items-center text-gray-600 mb-4">
              <MapPin className="h-4 w-4 mr-2 text-[#3C1361]" />
              <span className="text-sm line-clamp-1">
                {building.endereco}, {building.bairro}
              </span>
            </div>
            
            {/* Stats Row */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center text-gray-600">
                <Building2 className="h-4 w-4 mr-1 text-[#3C1361]" />
                <span className="text-sm">
                  {building.quantidade_telas} {building.quantidade_telas === 1 ? 'painel' : 'painéis'}
                </span>
              </div>
              
              <div className="flex items-center text-gray-600">
                <Users className="h-4 w-4 mr-1 text-[#3C1361]" />
                <span className="text-sm">
                  {estimatedResidents} pessoas
                </span>
              </div>
            </div>
            
            {/* Price and CTA Section */}
            <div className="mt-auto">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500">A partir de</p>
                  <p className="text-2xl font-bold text-[#3C1361]">
                    R$ {building.preco_base || 280}
                    <span className="text-sm font-normal text-gray-500">/mês</span>
                  </p>
                </div>
              </div>
              
              {/* Add to Cart Button */}
              <ModernAddToCartButton 
                panel={panel}
                size="default"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CleanBuildingCard;
