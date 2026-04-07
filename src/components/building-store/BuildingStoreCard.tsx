
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BuildingStore } from '@/services/buildingStoreService';
import { useIsMobile } from '@/hooks/use-mobile';
import BuildingCardImage from './card/BuildingCardImage';
import BuildingCardHeader from './card/BuildingCardHeader';
import BuildingCardMetrics from './card/BuildingCardMetrics';
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

  // Modo compact vertical para grid (e-commerce style) - REDESIGN MINIMALISTA
  if (compactMode && !isMobile) {
    return (
      <Card 
        id={`building-${building.id}`} 
        className="overflow-hidden bg-white hover:shadow-lg transition-all duration-200 border border-gray-200 group relative h-full flex flex-col cursor-pointer rounded-lg"
        onMouseEnter={() => setHoveredBuilding?.(building.id)}
        onMouseLeave={() => setHoveredBuilding?.(null)}
        onClick={() => setSelectedBuildingId?.(building.id)}
      >
        <CardContent className="p-0 flex flex-col h-full">
          {/* Imagem - Aspect ratio 16:10 */}
          <div className="relative overflow-hidden aspect-[16/10]">
            <BuildingCardImage building={building} mode="fill" />
          </div>

          {/* Conteúdo */}
          <div className="p-4 flex flex-col flex-1 space-y-3">
            {/* Header */}
            <BuildingCardHeader building={building} businessLocation={businessLocation} />

            {/* Métricas */}
            <BuildingCardMetrics building={building} />

            {/* Ações - sempre no final */}
            <div className="mt-auto pt-3 border-t border-gray-100">
              <BuildingCardActions building={building} />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isMobile) {
    // Layout mobile: Card vertical compacto otimizado para touch - REDESIGN MINIMALISTA
    return (
      <Card 
        id={`building-${building.id}`}
        className="overflow-hidden bg-white hover:shadow-md transition-all duration-200 border border-gray-200 cursor-pointer touch-manipulation flex flex-col h-full rounded-lg"
        onClick={() => setSelectedBuildingId?.(building.id)}
      >
        <CardContent className="p-0 flex flex-col h-full">
          {/* Imagem no topo - Aspect ratio 16:10 */}
          <div className="relative w-full h-44 overflow-hidden flex-shrink-0">
            <BuildingCardImage building={building} mode="fill" />
          </div>

          {/* Conteúdo abaixo */}
          <div className="flex-1 p-3 flex flex-col space-y-3">
            <BuildingCardHeader building={building} businessLocation={businessLocation} />
            <BuildingCardMetrics building={building} />

            {/* Ações */}
            <div className="mt-auto pt-3 border-t border-gray-100">
              <BuildingCardActions building={building} />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Layout desktop padrão: Card horizontal (fallback para páginas individuais) - REDESIGN MINIMALISTA
  return (
    <Card 
      id={`building-${building.id}`} 
      className="overflow-hidden bg-white hover:shadow-lg transition-all duration-200 border border-gray-200 group relative rounded-lg" 
      onMouseEnter={() => setHoveredBuilding?.(building.id)} 
      onMouseLeave={() => setHoveredBuilding?.(null)} 
      onClick={() => setSelectedBuildingId?.(building.id)}
    >
      <CardContent className="p-0 relative">
        <div className="flex flex-col lg:flex-row">
          {/* Imagem Principal - Desktop: Lado esquerdo */}
          <div className="lg:w-2/5 relative overflow-hidden">
            <BuildingCardImage building={building} mode="fill" />
          </div>

          {/* Informações - Desktop: Lado direito */}
          <div className="lg:w-3/5 p-6 flex flex-col space-y-4">
            <BuildingCardHeader building={building} businessLocation={businessLocation} />
            <BuildingCardMetrics building={building} />
            
            {/* Ações - No final */}
            <div className="mt-auto pt-4 border-t border-gray-100">
              <BuildingCardActions building={building} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BuildingStoreCard;
