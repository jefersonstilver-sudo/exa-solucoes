
import React from 'react';
import { Building, MapPin, Monitor, Clock, ArrowUp, Users, Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BuildingInfoProps {
  buildingName: string;
  address: string;
  bairro: string;
  impactScore: number;
  mode: string;
  installDate: Date;
  lastSync: Date;
  estimatedResidents: number;
  visualRating: number;
}

export const BuildingInfo: React.FC<BuildingInfoProps> = ({
  buildingName,
  address,
  bairro,
  impactScore,
  mode,
  installDate,
  lastSync,
  estimatedResidents,
  visualRating
}) => {
  const lastSyncFormatted = formatDistanceToNow(lastSync, { addSuffix: true, locale: ptBR });

  return (
    <div className="mb-6 border-b pb-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-semibold text-indexa-purple mb-1 flex items-center">
            <Building className="h-5 w-5 mr-2 text-indexa-purple" />
            {buildingName || 'Nome do Edifício'}
          </h3>
          
          <p className="text-gray-600 mb-2 flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-gray-500" />
            {address || 'Endereço'}, {bairro || 'Bairro'}
          </p>
        </div>
        
        <div className="bg-indexa-purple/10 rounded-lg p-2 flex flex-col items-center">
          <div className="text-xs text-gray-600 mb-1">Impacto</div>
          <div className="text-xl font-bold text-indexa-purple">{impactScore}</div>
          <div className="text-[10px] text-gray-500">de 100</div>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-y-2 gap-x-6 mt-3 text-xs">
        <div className="flex items-center text-gray-600">
          <Monitor className="h-3.5 w-3.5 mr-1.5 text-indexa-purple" />
          <span>{mode === 'indoor' ? 'Painel interno' : 'Painel externo'}</span>
        </div>
        
        <div className="flex items-center text-gray-600">
          <Clock className="h-3.5 w-3.5 mr-1.5 text-indexa-purple" />
          <span>Instalado: {installDate.toLocaleDateString('pt-BR')}</span>
        </div>

        <div className="flex items-center text-gray-600">
          <ArrowUp className="h-3.5 w-3.5 mr-1.5 text-indexa-purple" />
          <span>Atualizado: {lastSyncFormatted}</span>
        </div>
        
        <div className="flex items-center text-gray-600">
          <Users className="h-3.5 w-3.5 mr-1.5 text-indexa-purple" />
          <span>Aprox. {estimatedResidents} residentes</span>
        </div>
        
        <div className="flex items-center text-gray-600">
          <Star className="h-3.5 w-3.5 mr-1.5 text-indexa-purple" />
          <span>Qualidade visual: {visualRating}/5</span>
        </div>
      </div>
    </div>
  );
};
