
import React from 'react';
import { MapPin } from 'lucide-react';
import { BuildingStore } from '@/services/buildingStoreService';

// Helper local para extrair bairro caso necessário
const extractNeighborhoodFromAddress = (endereco?: string): string => {
  if (!endereco) return '';
  
  // Normalizar diferentes tipos de travessão
  const normalized = endereco.replace(/[–—−]/g, '-');
  
  // Padrão: "Rua/Avenida Nome, Número - Bairro, Cidade"
  const pattern1 = /,\s*\d+[a-zA-Z]?\s*[-–—−]\s*([^,]+)\s*,/;
  const match1 = normalized.match(pattern1);
  if (match1?.[1]) return match1[1].trim();
  
  // Padrão alternativo: "Nome - Bairro, Cidade"
  const pattern2 = /[-–—−]\s*([^,]+)\s*,/;
  const match2 = normalized.match(pattern2);
  if (match2?.[1]) return match2[1].trim();
  
  return '';
};

interface BuildingCardHeaderProps {
  building: BuildingStore;
}

const BuildingCardHeader: React.FC<BuildingCardHeaderProps> = ({ building }) => {
  // Fallback local caso o bairro ainda não esteja sendo extraído corretamente no serviço
  const bairroDisplay = building.bairro || 
    extractNeighborhoodFromAddress(building.endereco) || 
    'Bairro não informado';

  return (
    <div className="mb-4">
      <h3 className="text-xl font-bold text-gray-900 mb-1">
        {building.nome}
      </h3>
      <div className="flex items-center text-gray-600 mb-2">
        <MapPin className="h-4 w-4 mr-1" />
        <span className="text-sm">{bairroDisplay}</span>
      </div>
      <p className="text-gray-600 text-xs">
        {building.endereco}
      </p>
    </div>
  );
};

export default BuildingCardHeader;
