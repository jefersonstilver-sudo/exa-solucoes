
import React from 'react';
import { UserCircle, Phone } from 'lucide-react';

interface BuildingContactInfoProps {
  building: any;
}

const BuildingContactInfo: React.FC<BuildingContactInfoProps> = ({ building }) => {
  const hasContactInfo = building.nome_sindico || building.contato_sindico || 
                        building.nome_vice_sindico || building.contato_vice_sindico || 
                        building.nome_contato_predio || building.numero_contato_predio;

  if (!hasContactInfo) return null;

  return (
    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-1 mb-2">
        <UserCircle className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-medium text-gray-700">Contatos</span>
      </div>
      <div className="space-y-1 text-xs text-gray-600">
        {building.nome_sindico && (
          <div className="flex items-center space-x-1">
            <span className="font-medium">Síndico:</span>
            <span>{building.nome_sindico}</span>
            {building.contato_sindico && (
              <>
                <Phone className="h-3 w-3 ml-1" />
                <span>{building.contato_sindico}</span>
              </>
            )}
          </div>
        )}
        {building.nome_vice_sindico && (
          <div className="flex items-center space-x-1">
            <span className="font-medium">Vice:</span>
            <span>{building.nome_vice_sindico}</span>
            {building.contato_vice_sindico && (
              <>
                <Phone className="h-3 w-3 ml-1" />
                <span>{building.contato_vice_sindico}</span>
              </>
            )}
          </div>
        )}
        {building.nome_contato_predio && (
          <div className="flex items-center space-x-1">
            <span className="font-medium">Prédio:</span>
            <span>{building.nome_contato_predio}</span>
            {building.numero_contato_predio && (
              <>
                <Phone className="h-3 w-3 ml-1" />
                <span>{building.numero_contato_predio}</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BuildingContactInfo;
