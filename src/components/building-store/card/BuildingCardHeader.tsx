
import React from 'react';
import { MapPin } from 'lucide-react';
import { BuildingStore } from '@/services/buildingStoreService';
import BuildingCardDistance from './BuildingCardDistance';

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
  businessLocation?: { lat: number; lng: number } | null;
}

const BuildingCardHeader: React.FC<BuildingCardHeaderProps> = ({ building, businessLocation }) => {
  // Fallback local caso o bairro ainda não esteja sendo extraído corretamente no serviço
  const bairroDisplay = building.bairro || 
    extractNeighborhoodFromAddress(building.endereco) || 
    'Bairro não informado';

  return (
    <div className="mb-4">
      <div className="flex items-start justify-between gap-3 mb-1">
        <h3 className="text-xl font-bold text-gray-900 flex-1">
          {building.nome}
        </h3>
        {businessLocation && (
          <div className="flex-shrink-0">
            <BuildingCardDistance building={building} businessLocation={businessLocation} />
          </div>
        )}
      </div>
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
