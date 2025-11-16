
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
import useBuildingStore from '@/hooks/building-store/useBuildingStore';

interface BuildingStoreCardProps {
  building: BuildingStore;
  compactMode?: boolean;
}

const BuildingStoreCard: React.FC<BuildingStoreCardProps> = ({ 
  building,
  compactMode = false
}) => {
  const isMobile = useIsMobile();
  const { setHoveredBuilding, setSelectedBuildingId, businessLocation } = useBuildingStore();

  console.log('🏢 [BUILDING STORE CARD] === RENDERIZANDO CARD ===');
  console.log('🏢 [BUILDING STORE CARD] isMobile:', isMobile);
  console.log('🏢 [BUILDING STORE CARD] compactMode:', compactMode);
  console.log('🏢 [BUILDING STORE CARD] Building:', building.nome);

  // Modo compact vertical para grid de 2 colunas (e-commerce style)
  if (compactMode && !isMobile) {
    return (
      <Card 
        id={`building-${building.id}`} 
        className="overflow-hidden bg-white shadow-lg hover:shadow-2xl transition-all duration-300 border-0 group relative h-full flex flex-col cursor-pointer"
        onMouseEnter={() => setHoveredBuilding?.(building.id)}
        onMouseLeave={() => setHoveredBuilding?.(null)}
        onClick={() => setSelectedBuildingId?.(building.id)}
      >
        {/* Banner PRÉ-VENDA */}
        {(building.status?.toLowerCase() === 'instalação' || building.status?.toLowerCase() === 'instalacao') && (
          <div className="absolute top-3 right-3 z-30 transform rotate-12">
            <div className="bg-blue-600 text-white px-3 py-1.5 text-xs font-bold tracking-wide shadow-xl rounded-lg border-2 border-white">
              PRÉ-VENDA
            </div>
          </div>
        )}
        
        <CardContent className="p-0 flex flex-col h-full">
          {/* Imagem - Aspect ratio 4:3 */}
          <div className="relative overflow-hidden aspect-[4/3]">
            <BuildingCardImage building={building} mode="fill" />
            
            {/* Badge Premium */}
            {building.padrao_publico === 'alto' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 }}
                className="absolute bottom-2 right-2 z-10"
              >
                <div className="bg-amber-500 text-white px-2 py-1 rounded-md text-xs font-semibold border border-amber-600">
                  ⭐ Premium
                </div>
              </motion.div>
            )}
          </div>

          {/* Conteúdo - Flexível e compacto */}
          <div className="p-4 flex flex-col flex-1">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col h-full"
            >
              {/* Header */}
              <div className="mb-3">
                <BuildingCardHeader building={building} businessLocation={businessLocation} />
              </div>

              {/* Métricas compactas */}
              <div className="mb-3 flex-1">
                <BuildingCardMetrics building={building} />
              </div>

              {/* Amenities inline */}
              <div className="mb-3">
                <BuildingCardAmenities building={building} />
              </div>

              {/* Ações - sempre no final */}
              <div className="mt-auto">
                <BuildingCardActions building={building} />
              </div>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isMobile) {
    // Layout mobile: Card vertical compacto otimizado para touch
    return (
      <Card 
        id={`building-${building.id}`}
        className="overflow-hidden bg-white shadow-md hover:shadow-xl active:shadow-sm transition-all duration-200 border-0 cursor-pointer touch-manipulation flex flex-col h-full"
        onClick={() => setSelectedBuildingId?.(building.id)}
      >
        {/* Banner PRÉ-VENDA - Mobile */}
        {(building.status?.toLowerCase() === 'instalação' || building.status?.toLowerCase() === 'instalacao') && (
          <div className="absolute top-1.5 right-1.5 z-30">
            <div className="bg-blue-600 text-white px-1.5 py-0.5 text-[9px] font-bold tracking-wide shadow-lg rounded border border-white">
              PRÉ-VENDA
            </div>
          </div>
        )}
        <CardContent className="p-0 flex flex-col h-full">
          {/* Imagem no topo - Aspect ratio 16:10 */}
          <div className="relative w-full aspect-[16/10] flex-shrink-0">
            <BuildingCardImage building={building} mode="fill" />
            
          {/* Badge premium */}
          {building.padrao_publico === 'alto' && (
            <div className="absolute bottom-1.5 right-1.5 z-10">
              <div className="bg-amber-500 text-white px-1.5 py-0.5 rounded text-[10px] font-semibold border border-amber-600 shadow-sm">
                ⭐ Premium
              </div>
            </div>
          )}
          </div>

          {/* Conteúdo abaixo - Compacto e organizado */}
          <div className="flex-1 p-3 flex flex-col min-h-0">
            <div className="space-y-2 flex-1 min-h-0">
              <BuildingCardHeader building={building} businessLocation={businessLocation} />
              <BuildingCardMetrics building={building} />
              <BuildingCardAmenities building={building} />
            </div>

            {/* Ações - sempre no final */}
            <div className="mt-2 pt-2 border-t">
              <BuildingCardActions building={building} />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Layout desktop padrão: Card horizontal (fallback para páginas individuais)
  return (
    <Card 
      id={`building-${building.id}`} 
      className="overflow-hidden bg-white shadow-xl hover:shadow-2xl transition-all duration-500 border-0 group relative" 
      onMouseEnter={() => setHoveredBuilding?.(building.id)} 
      onMouseLeave={() => setHoveredBuilding?.(null)} 
      onClick={() => setSelectedBuildingId?.(building.id)}
    >
      {/* Banner PRÉ-VENDA no topo direito do card */}
      {(building.status?.toLowerCase() === 'instalação' || building.status?.toLowerCase() === 'instalacao') && (
        <div className="absolute top-3 right-3 z-30 transform rotate-12">
          <div className="bg-blue-600 text-white px-3 py-1.5 text-xs font-bold tracking-wide shadow-xl rounded-lg border-2 border-white">
            PRÉ-VENDA
          </div>
        </div>
      )}
      <CardContent className="p-0 relative">
        <div className="flex flex-col lg:flex-row min-h-[320px]">
          {/* Imagem Principal - Desktop: Lado esquerdo */}
          <div className="lg:w-2/5 relative overflow-hidden">
            <BuildingCardImage building={building} mode="square" />
            
            {/* Badge de prioridade se for high-end */}
            {building.padrao_publico === 'alto' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 }}
                className="absolute bottom-3 right-3 z-10"
              >
                <div className="bg-amber-500 text-white px-3 py-1.5 rounded-md text-xs font-semibold border border-amber-600">
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
                <BuildingCardHeader building={building} businessLocation={businessLocation} />
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
