
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
  console.log('🏢 [BUILDING STORE CARD] === RENDERIZANDO CARD PREMIUM ===');
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
    <Card className="overflow-hidden bg-white shadow-lg hover:shadow-2xl transition-all duration-500 border-0 group relative">
      {/* Gradient overlay sutil */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-[#3C1361]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10"></div>
      
      {/* Glow effect on hover */}
      <div className="absolute -inset-1 bg-gradient-to-r from-[#3C1361]/20 via-[#4A1B6B]/20 to-[#3C1361]/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"></div>
      
      <CardContent className="p-0 relative z-20">
        <div className="flex flex-col lg:flex-row">
          {/* Imagem Principal - Lado Esquerdo */}
          <div className="lg:w-2/5 relative overflow-hidden">
            <BuildingCardImage building={building} />
            
            {/* Badge de status */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="absolute top-4 left-4 z-10"
            >
              <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm bg-green-500/90">
                ✨ Disponível
              </div>
            </motion.div>

            {/* Badge de prioridade se for high-end */}
            {building.padrao_publico === 'alto' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 }}
                className="absolute top-4 right-4 z-10"
              >
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                  ⭐ Premium
                </div>
              </motion.div>
            )}
          </div>

          {/* Informações - Lado Direito */}
          <div className="lg:w-3/5 p-6 lg:p-8 relative">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
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
            </motion.div>

            {/* Decorative element */}
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-[#3C1361]/5 to-transparent rounded-tl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BuildingStoreCard;
