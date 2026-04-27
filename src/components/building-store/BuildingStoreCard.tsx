
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

const isEmInstalacao = (status?: string) =>
  String(status || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .includes('instala');

const BuildingStoreCard: React.FC<BuildingStoreCardProps> = ({ 
  building,
  compactMode = false
}) => {
  const isMobile = useIsMobile();
  const { setHoveredBuilding, setSelectedBuildingId, businessLocation } = useBuildingStore();

  const emInstalacao = isEmInstalacao(building.status);

  // Em instalação: vitrine apenas — não abre detalhe nem adiciona ao carrinho
  const handleOpenDetails = () => {
    if (emInstalacao) {
      console.log('🛠️ [BuildingStoreCard] Bloqueado: prédio em instalação', building.nome);
      return;
    }
    setSelectedBuildingId?.(building.id);
  };

  const installBaseClass = emInstalacao
    ? 'cursor-default ring-1 ring-amber-300/50'
    : 'cursor-pointer';
  const installHoverClass = emInstalacao ? '' : 'hover:shadow-lg';

  // Modo compact vertical para grid (e-commerce style) - REDESIGN MINIMALISTA
  if (compactMode && !isMobile) {
    return (
      <Card 
        id={`building-${building.id}`} 
        className={`overflow-hidden bg-white transition-all duration-200 border border-gray-200 group relative h-full flex flex-col rounded-lg ${installBaseClass} ${installHoverClass}`}
        onMouseEnter={() => !emInstalacao && setHoveredBuilding?.(building.id)}
        onMouseLeave={() => !emInstalacao && setHoveredBuilding?.(null)}
        onClick={handleOpenDetails}
        aria-disabled={emInstalacao}
      >
        <CardContent className="p-0 flex flex-col h-full">
          <div className="relative overflow-hidden aspect-[16/10]">
            <BuildingCardImage building={building} mode="fill" />
          </div>

          <div className="p-4 flex flex-col flex-1 space-y-3">
            <BuildingCardHeader building={building} businessLocation={businessLocation} />
            <BuildingCardMetrics building={building} />

            <div className="mt-auto pt-3 border-t border-gray-100">
              <BuildingCardActions building={building} />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isMobile) {
    return (
      <Card 
        id={`building-${building.id}`}
        className={`overflow-hidden bg-white transition-all duration-200 border border-gray-200 touch-manipulation flex flex-col h-full rounded-lg ${installBaseClass} ${emInstalacao ? '' : 'hover:shadow-md'}`}
        onClick={handleOpenDetails}
        aria-disabled={emInstalacao}
      >
        <CardContent className="p-0 flex flex-col h-full">
          <div className="relative w-full h-44 overflow-hidden flex-shrink-0">
            <BuildingCardImage building={building} mode="fill" />
          </div>

          <div className="flex-1 p-3 flex flex-col space-y-3">
            <BuildingCardHeader building={building} businessLocation={businessLocation} />
            <BuildingCardMetrics building={building} />

            <div className="mt-auto pt-3 border-t border-gray-100">
              <BuildingCardActions building={building} />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Layout desktop padrão: Card horizontal
  return (
    <Card 
      id={`building-${building.id}`} 
      className={`overflow-hidden bg-white transition-all duration-200 border border-gray-200 group relative rounded-lg ${installBaseClass} ${installHoverClass}`}
      onMouseEnter={() => !emInstalacao && setHoveredBuilding?.(building.id)} 
      onMouseLeave={() => !emInstalacao && setHoveredBuilding?.(null)} 
      onClick={handleOpenDetails}
      aria-disabled={emInstalacao}
    >
      <CardContent className="p-0 relative">
        <div className="flex flex-col lg:flex-row">
          <div className="lg:w-2/5 relative overflow-hidden">
            <BuildingCardImage building={building} mode="fill" />
          </div>

          <div className="lg:w-3/5 p-6 flex flex-col space-y-4">
            <BuildingCardHeader building={building} businessLocation={businessLocation} />
            <BuildingCardMetrics building={building} />
            
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
