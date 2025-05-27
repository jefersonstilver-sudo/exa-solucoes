
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { BuildingStore } from '@/services/buildingStoreService';
import { Panel } from '@/types/panel';
import BuildingCardImage from './card/BuildingCardImage';
import BuildingCardHeader from './card/BuildingCardHeader';
import BuildingCardMetrics from './card/BuildingCardMetrics';
import BuildingCardAmenities from './card/BuildingCardAmenities';
import BuildingCardActions from './card/BuildingCardActions';

interface BuildingStoreCardProps {
  building: BuildingStore;
  onAddToCart: (panel: Panel, duration?: number) => void;
}

const BuildingStoreCard: React.FC<BuildingStoreCardProps> = ({ 
  building, 
  onAddToCart 
}) => {
  console.log('🏢 [BUILDING STORE CARD] === RENDERIZANDO CARD ===');
  console.log('🏢 [BUILDING STORE CARD] Building recebido:', {
    id: building.id,
    nome: building.nome,
    endereco: building.endereco,
    bairro: building.bairro,
    status: building.status,
    preco_base: building.preco_base,
    quantidade_telas: building.quantidade_telas,
    venue_type: building.venue_type,
    imagem_principal: building.imagem_principal
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ 
        y: -4,
        transition: { duration: 0.2 }
      }}
      className="w-full"
    >
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-white shadow-md">
        <CardContent className="p-0">
          <div className="flex flex-col lg:flex-row">
            {/* Imagem Principal - Lado Esquerdo */}
            <BuildingCardImage building={building} />

            {/* Informações - Lado Direito */}
            <div className="lg:w-3/5 p-4 lg:p-5">
              {/* Header com Nome e Localização */}
              <BuildingCardHeader building={building} />

              {/* Métricas Principais */}
              <BuildingCardMetrics building={building} />

              {/* Amenities */}
              <BuildingCardAmenities building={building} />

              {/* Preço e Ações */}
              <BuildingCardActions 
                building={building}
                onAddToCart={onAddToCart}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default BuildingStoreCard;
