
import React from 'react';
import { Loader2 } from 'lucide-react';

interface ResultsHeaderProps {
  isLoading: boolean;
  isSearching: boolean;
  panelsCount: number;
}

const ResultsHeader: React.FC<ResultsHeaderProps> = ({ 
  isLoading, 
  isSearching, 
  panelsCount 
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
        <select className="px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-indexa-purple">
          <option>Ordenar por: Relevância</option>
          <option>Ordenar por: Maior Preço</option>
          <option>Ordenar por: Menor Preço</option>
          <option>Ordenar por: Mais visualizações</option>
        </select>
      </div>
    </div>
  );
};

export default ResultsHeader;
