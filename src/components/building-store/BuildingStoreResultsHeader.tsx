import React from 'react';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BuildingStoreResultsHeaderProps {
  isLoading: boolean;
  isSearching: boolean;
  buildingsCount: number;
  onSortChange?: (value: string) => void;
  sortOption?: string;
  hasLocationSearch?: boolean;
}

const BuildingStoreResultsHeader: React.FC<BuildingStoreResultsHeaderProps> = ({ 
  isLoading, 
  isSearching, 
  buildingsCount,
  onSortChange = () => {},
  sortOption = 'relevance',
  hasLocationSearch = false
}) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-semibold text-indexa-purple">
        {isLoading || isSearching ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Buscando prédios...</span>
          </div>
        ) : (
          <>
            {buildingsCount === 0 ? (
              'Nenhum prédio encontrado'
            ) : buildingsCount === 1 ? (
              '1 prédio disponível'
            ) : (
              `${buildingsCount} prédios disponíveis`
            )}
          </>
        )}
      </h2>
      
      <div className="flex items-center gap-2">
        <Select value={sortOption} onValueChange={onSortChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            {hasLocationSearch && (
              <SelectItem value="distance">Ordenar por: Distância</SelectItem>
            )}
            <SelectItem value="price-asc">Ordenar por: Menor Preço</SelectItem>
            <SelectItem value="price-desc">Ordenar por: Maior Preço</SelectItem>
            <SelectItem value="audience-desc">Ordenar por: Maior Público</SelectItem>
            <SelectItem value="views-desc">Ordenar por: Mais Visualizações</SelectItem>
            <SelectItem value="panels-desc">Ordenar por: Mais Telas</SelectItem>
            {!hasLocationSearch && (
              <SelectItem value="relevance">Ordenar por: Relevância</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default BuildingStoreResultsHeader;