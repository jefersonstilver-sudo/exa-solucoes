
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BuildingStore {
  id: string;
  nome: string;
  endereco: string;
  bairro: string;
  venue_type: string;
  status: string;
  latitude: number;
  longitude: number;
  publico_estimado: number;
  visualizacoes_mes: number;
  preco_base: number;
  imagem_principal: string;
  imagem_2: string;
  imagem_3: string;
  imagem_4: string;
  amenities: string[];
  caracteristicas: string[];
  padrao_publico: 'alto' | 'medio' | 'normal';
  quantidade_telas: number;
  numero_unidades: number;
  nome_contato_predio: string;
  numero_contato_predio: string;
}

export const fetchBuildingsForStore = async (lat?: number, lng?: number, radius = 5000) => {
  try {
    // Query principal: buscar TODOS os prédios ativos
    let query = supabase
      .from('buildings')
      .select('*')
      .eq('status', 'ativo')
      .order('created_at', { ascending: false });

    const { data: buildings, error } = await query;

    if (error) {
      toast.error(`Erro ao carregar prédios: ${error.message}`);
      return [];
    }

    if (!buildings || buildings.length === 0) {
      return [];
    }

    // Se há coordenadas, calcular distância e filtrar por raio
    if (lat && lng && buildings) {
      const buildingsWithDistance = buildings.map((building: any) => {
        if (building.latitude && building.longitude) {
          const distance = getDistanceFromLatLonInKm(lat, lng, building.latitude, building.longitude) * 1000;
          return { ...building, distance };
        }
        return { ...building, distance: 999999 };
      });

      // Filtrar por raio
      const filteredBuildings = buildingsWithDistance.filter(building => 
        building.distance <= radius
      );
      
      return filteredBuildings.sort((a, b) => a.distance - b.distance);
    }

    return buildings || [];
    
  } catch (error: any) {
    toast.error('Erro crítico ao carregar prédios');
    return [];
  }
};

// Função auxiliar para calcular distância
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Raio da Terra em km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c;
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI/180);
}

export const getBuildingImageUrls = (building: any) => {
  const urls = [];
  if (building.imagem_principal) urls.push(building.imagem_principal);
  if (building.imagem_2) urls.push(building.imagem_2);
  if (building.imagem_3) urls.push(building.imagem_3);
  if (building.imagem_4) urls.push(building.imagem_4);
  return urls;
};
