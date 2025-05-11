
import React from 'react';
import { Loader2 } from 'lucide-react';

interface ResultsHeaderProps {
  isLoading: boolean;
  isSearching: boolean;
  panelsCount: number;
  locationTypeLabel?: string;
}

const ResultsHeader: React.FC<ResultsHeaderProps> = ({ 
  isLoading, 
  isSearching, 
  panelsCount,
  locationTypeLabel = 'todos os locais' 
}) => {
  if (isLoading || isSearching) {
    return (
      <div className="mb-6 flex items-center justify-center text-indexa-purple">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        <span className="font-medium">Carregando painéis...</span>
      </div>
    );
  }

  return (
    <div className="mb-6 flex justify-between items-center">
      <h2 className="text-xl font-semibold text-indexa-purple">
        {panelsCount > 0 ? (
          <>
            {panelsCount} {panelsCount === 1 ? 'painel encontrado' : 'painéis encontrados'}
            <span className="font-normal text-base ml-1.5 text-gray-600">
              em {locationTypeLabel}
            </span>
          </>
        ) : (
          'Nenhum resultado encontrado'
        )}
      </h2>
    </div>
  );
};

export default ResultsHeader;
