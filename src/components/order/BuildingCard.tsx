
import React from 'react';
import { MapPin, Users, Building } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface BuildingDetails {
  id: string;
  nome: string;
  endereco: string;
  bairro: string;
  imageurl?: string;
  imagem_principal?: string;
  imagem_2?: string;
  imagem_3?: string;
  imagem_4?: string;
  publico_estimado?: number;
  numero_unidades?: number;
  caracteristicas?: string[];
}

interface BuildingCardProps {
  building: BuildingDetails;
  index: number;
}

const getBuildingImageUrl = (building: BuildingDetails): string | null => {
  // Prioridade: imagem_principal -> imageurl -> null
  const imagePath = building.imagem_principal || building.imageurl;
  
  if (!imagePath) return null;
  
  // Se é uma URL completa, retorna diretamente
  if (imagePath.startsWith('http')) return imagePath;
  
  // Se é um path, constrói URL do Supabase Storage
  return supabase.storage.from('building-images').getPublicUrl(imagePath).data.publicUrl;
};

export const BuildingCard: React.FC<BuildingCardProps> = ({ building, index }) => {
  const imageUrl = getBuildingImageUrl(building);
  
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <div className="relative">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={building.nome}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Building className="h-16 w-16 text-white opacity-70" />
          </div>
        )}
        <div className="absolute top-3 left-3 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
          Local {index + 1}
        </div>
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-bold text-lg mb-2 text-gray-900">{building.nome}</h3>
        
        <div className="flex items-start space-x-2 mb-3">
          <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-gray-600">
            <div>{building.endereco}</div>
            <div className="font-medium text-gray-800">{building.bairro}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          {building.numero_unidades && building.numero_unidades > 0 && (
            <div className="flex items-center space-x-2">
              <Building className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-gray-600">{building.numero_unidades} unidades</span>
            </div>
          )}
          
          {building.publico_estimado && building.publico_estimado > 0 && (
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-green-500" />
              <span className="text-sm text-gray-600">{building.publico_estimado.toLocaleString()} pessoas</span>
            </div>
          )}
        </div>

        {building.caracteristicas && building.caracteristicas.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {building.caracteristicas.slice(0, 3).map((caracteristica, idx) => (
              <span 
                key={idx}
                className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs"
              >
                {caracteristica}
              </span>
            ))}
            {building.caracteristicas.length > 3 && (
              <span className="inline-block bg-gray-100 text-gray-500 px-2 py-1 rounded-md text-xs">
                +{building.caracteristicas.length - 3} mais
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
