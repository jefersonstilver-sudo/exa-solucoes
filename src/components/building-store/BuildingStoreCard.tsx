
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
  console.log('🏢 [BUILDING STORE CARD] === RENDERIZANDO CARD COMPACTO ===');
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
    <Card className="overflow-hidden bg-white shadow-xl hover:shadow-2xl transition-all duration-500 border-0 group relative">
      <CardContent className="p-0 relative">
        <div className="flex flex-col lg:flex-row min-h-[320px]">
          {/* Imagem Principal - Agora mais proeminente */}
          <div className="lg:w-2/5 relative overflow-hidden">
            <BuildingCardImage building={building} />
            
            {/* Badge de status */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="absolute top-3 right-3 z-10"
            >
              <div className="bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm bg-green-500/90">
                ✨ Disponível
              </div>
            </motion.div>

            {/* Badge de prioridade se for high-end */}
            {building.padrao_publico === 'alto' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 }}
                className="absolute bottom-3 right-3 z-10"
              >
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
                  ⭐ Premium
                </div>
              </motion.div>
            )}
          </div>

          {/* Informações - Lado Direito Mais Compacto */}
          <div className="lg:w-3/5 p-4 lg:p-6 relative flex flex-col justify-between">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex-1 flex flex-col justify-between"
            >
              {/* Header com Nome e Localização */}
              <div className="mb-4">
                <BuildingCardHeader building={building} />
              </div>

              {/* Métricas Principais */}
              <div className="mb-4">
                <BuildingCardMetrics building={building} />
              </div>

              {/* Amenities */}
              <div className="mb-4">
                <BuildingCardAmenities building={building} />
              </div>

              {/* Preço e Ações */}
              <div className="mt-auto">
                <BuildingCardActions 
                  building={building}
                  onAddToCart={onAddToCart}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BuildingStoreCard;
