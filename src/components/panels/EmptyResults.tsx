
import React from 'react';
import { Search } from 'lucide-react';

const EmptyResults: React.FC = () => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center">
          <Search className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium">Nenhum painel encontrado</h3>
        <p className="text-gray-500 max-w-md">
          Não encontramos painéis com os filtros atuais. Tente ajustar os filtros ou buscar em outra localização.
        </p>
      </div>
    </div>
  );
};

export default EmptyResults;
