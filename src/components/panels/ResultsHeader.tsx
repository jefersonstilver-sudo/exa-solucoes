
import React from 'react';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ResultsHeaderProps {
  isLoading: boolean;
  isSearching: boolean;
  panelsCount: number;
  onSortChange?: (value: string) => void;
  sortOption?: string;
}

const ResultsHeader: React.FC<ResultsHeaderProps> = ({ 
  isLoading, 
  isSearching, 
  panelsCount,
  onSortChange = () => {},
  sortOption = 'relevance'
}) => {
  return (
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-semibold text-indexa-purple">
        {isLoading || isSearching ? (
          <div className="flex items-center">
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Buscando painéis...
          </div>
        ) : panelsCount > 0 ? (
          <>Painéis disponíveis</>
        ) : (
          <>Nenhum painel encontrado</>
        )}
      </h2>
      <div className="flex items-center gap-2">
        <Select defaultValue={sortOption} onValueChange={onSortChange}>
          <SelectTrigger className="w-[180px] text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-indexa-purple">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance">Ordenar por: Relevância</SelectItem>
            <SelectItem value="price_high">Ordenar por: Maior Preço</SelectItem>
            <SelectItem value="price_low">Ordenar por: Menor Preço</SelectItem>
            <SelectItem value="views">Ordenar por: Mais visualizações</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default ResultsHeader;
