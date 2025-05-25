
import React from 'react';
import { Building2 } from 'lucide-react';

interface BuildingsEmptyStateProps {
  buildingsCount: number;
  searchTerm: string;
  userEmail?: string;
}

const BuildingsEmptyState: React.FC<BuildingsEmptyStateProps> = ({
  buildingsCount,
  searchTerm,
  userEmail
}) => {
  return (
    <div className="text-center py-8 text-gray-500">
      <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
      {buildingsCount === 0 ? (
        <div>
          <p className="text-lg font-medium mb-2">Nenhum prédio encontrado</p>
          <p className="text-sm text-gray-400">
            As políticas RLS foram corrigidas com sucesso. 
            {userEmail === 'jefersonstilver@gmail.com' ? 
              ' Como super admin, você pode adicionar novos prédios.' :
              ' Contate o administrador para adicionar prédios.'
            }
          </p>
        </div>
      ) : (
        <p>Nenhum prédio corresponde à busca "{searchTerm}"</p>
      )}
    </div>
  );
};

export default BuildingsEmptyState;
