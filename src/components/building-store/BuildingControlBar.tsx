import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SlidersHorizontal, Map } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface BuildingControlBarProps {
  buildingsCount: number;
  sortOption: string;
  onSortChange: (value: string) => void;
  onFilterClick: () => void;
  onMapClick?: () => void;
}

const BuildingControlBar: React.FC<BuildingControlBarProps> = ({
  buildingsCount,
  sortOption,
  onSortChange,
  onFilterClick,
  onMapClick
}) => {
  const isMobile = useIsMobile();

  return (
    <div className="flex items-center justify-between py-3 px-4 bg-white border-b border-gray-100">
      {/* Contador de prédios */}
      <span className="text-sm text-gray-600">
        {buildingsCount} {buildingsCount === 1 ? 'prédio disponível' : 'prédios disponíveis'}
      </span>

      {/* Controles */}
      <div className="flex items-center gap-2">
        {/* Ordenar */}
        <Select value={sortOption} onValueChange={onSortChange}>
          <SelectTrigger className="h-9 text-sm border-gray-200 min-w-[140px]">
            <SelectValue placeholder="Ordenar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance">Relevância</SelectItem>
            <SelectItem value="price-asc">Menor preço</SelectItem>
            <SelectItem value="price-desc">Maior preço</SelectItem>
            <SelectItem value="distance">Distância</SelectItem>
            <SelectItem value="views">Visualizações</SelectItem>
          </SelectContent>
        </Select>

        {/* Filtrar */}
        <Button
          variant="outline"
          size="sm"
          onClick={onFilterClick}
          className="h-9 text-sm border-gray-200"
        >
          <SlidersHorizontal className="h-4 w-4 mr-1.5" />
          {isMobile ? '' : 'Filtrar'}
        </Button>

        {/* Mapa (opcional) */}
        {onMapClick && (
          <Button
            variant="outline"
            size="sm"
            onClick={onMapClick}
            className="h-9 text-sm border-gray-200"
          >
            <Map className="h-4 w-4 mr-1.5" />
            {isMobile ? '' : 'Mapa'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default BuildingControlBar;
