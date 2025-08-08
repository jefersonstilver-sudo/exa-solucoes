
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { BuildingStore } from '@/services/buildingStoreService';
import { useIsMobile } from '@/hooks/use-mobile';
import BuildingCardImage from './card/BuildingCardImage';
import BuildingCardHeader from './card/BuildingCardHeader';
import BuildingCardMetrics from './card/BuildingCardMetrics';
import BuildingCardAmenities from './card/BuildingCardAmenities';
import BuildingCardActions from './card/BuildingCardActions';
import { PlayCircle } from 'lucide-react';

interface BuildingStoreCardProps {
  building: BuildingStore;
  videoCount?: number;
}

const BuildingStoreCard: React.FC<BuildingStoreCardProps> = ({ 
  building,
  videoCount
}) => {
  const isMobile = useIsMobile();

  console.log('🏢 [BUILDING STORE CARD] === RENDERIZANDO CARD ===');
  console.log('🏢 [BUILDING STORE CARD] isMobile:', isMobile);
  console.log('🏢 [BUILDING STORE CARD] Building:', building.nome);

  if (isMobile) {
    // Layout mobile: Card vertical compacto com título no topo
    return (
      <Card className="overflow-hidden bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-0 group relative">
        <CardContent className="p-0 relative">
          <div className="flex flex-col">
            {/* Header com Nome e Localização - PRIMEIRO ELEMENTO */}
            <div className="p-4 pb-2">
              <BuildingCardHeader building={building} />
            </div>

            {/* Imagem Principal - Mobile: Menor altura */}
            <div className="relative overflow-hidden h-48 mx-4 rounded-lg">
              <BuildingCardImage building={building} />
              
              {/* Badge premium */}
              {building.padrao_publico === 'alto' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="absolute bottom-2 right-2 z-10"
                >
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold shadow-lg">
                    ⭐ Premium
                  </div>
                </motion.div>
              )}

              {/* Em exibição: contador */}
              {typeof videoCount === 'number' && (
                <div className="absolute bottom-2 left-2 z-10">
                  <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur px-2 py-1 rounded-full shadow-sm text-xs font-medium text-gray-800">
                    <PlayCircle className="w-3.5 h-3.5 text-green-600" />
                    <span>Em exibição: {videoCount}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Informações - Mobile: Layout compacto */}
            <div className="p-4 pt-3 space-y-3">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Métricas Principais */}
                <div className="mb-3">
                  <BuildingCardMetrics building={building} />
                </div>

                {/* Amenities */}
                <div className="mb-3">
                  <BuildingCardAmenities building={building} />
                </div>

                {/* Preço e Ações */}
                <div className="mt-4">
                  <BuildingCardActions building={building} />
                </div>
              </motion.div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Layout desktop: Card horizontal com título no topo
  return (
    <Card className="overflow-hidden bg-white shadow-xl hover:shadow-2xl transition-all duration-500 border-0 group relative">
      <CardContent className="p-0 relative">
        <div className="flex flex-col lg:flex-row min-h-[320px]">
          {/* Imagem Principal - Desktop: Lado esquerdo */}
          <div className="lg:w-2/5 relative overflow-hidden">
            <BuildingCardImage building={building} />
            
            {/* Em exibição: contador (desktop) */}
            {typeof videoCount === 'number' && (
              <div className="absolute bottom-3 left-3 z-10">
                <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur px-2 py-1 rounded-full shadow-sm text-xs font-medium text-gray-800">
                  <PlayCircle className="w-3.5 h-3.5 text-green-600" />
                  <span>Em exibição: {videoCount}</span>
                </div>
              </div>
            )}
            
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

          {/* Informações - Desktop: Lado direito com título no topo */}
          <div className="lg:w-3/5 p-4 lg:p-6 relative flex flex-col">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex flex-col h-full"
            >
              {/* Header com Nome e Localização - PRIMEIRO ELEMENTO */}
              <div className="mb-4">
                <BuildingCardHeader building={building} />
              </div>

              {/* Conteúdo flexível */}
              <div className="flex-1 flex flex-col justify-between">
                {/* Métricas Principais */}
                <div className="mb-4">
                  <BuildingCardMetrics building={building} />
                </div>

                {/* Amenities */}
                <div className="mb-4">
                  <BuildingCardAmenities building={building} />
                </div>

                {/* Preço e Ações - No final */}
                <div className="mt-auto">
                  <BuildingCardActions building={building} />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BuildingStoreCard;
