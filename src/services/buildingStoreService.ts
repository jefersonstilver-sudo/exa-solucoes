import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Panel } from '@/types/panel';

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
}

/**
 * VERSÃO SIMPLIFICADA E CONFIÁVEL
 */
export const fetchBuildingsForStore = async (): Promise<BuildingStore[]> => {
  try {
    console.log('🏢 [BUILDING STORE SERVICE] === VERSÃO SIMPLIFICADA ===');
    
    const { data: buildings, error } = await supabase
      .from('buildings')
      .select('*')
      .eq('status', 'ativo')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [BUILDING STORE SERVICE] Erro na query:', error);
      throw new Error(`Erro ao buscar prédios: ${error.message}`);
    }

    if (!buildings || buildings.length === 0) {
      console.warn('⚠️ [BUILDING STORE SERVICE] Nenhum prédio ativo encontrado');
      return [];
    }

    console.log('✅ [BUILDING STORE SERVICE] Prédios ativos encontrados:', buildings.length);
    
    // Log detalhado dos prédios encontrados
    buildings.forEach((building, index) => {
      console.log(`🏢 [BUILDING STORE SERVICE] Prédio ${index + 1}:`, {
        id: building.id,
        nome: building.nome,
        status: building.status,
        bairro: building.bairro,
        venue_type: building.venue_type,
        publico_estimado: building.publico_estimado,
        quantidade_telas: building.quantidade_telas,
        preco_base: building.preco_base
      });
    });

    return buildings as BuildingStore[];
    
  } catch (error: any) {
    console.error('💥 [BUILDING STORE SERVICE] Erro crítico:', error);
    toast.error('Erro crítico ao carregar prédios');
    return [];
  }
};

/**
 * Converte um BuildingStore em Panel para compatibilidade com o carrinho
 */
export const buildingToPanel = (building: BuildingStore): Panel => {
  return {
    id: building.id,
    code: `BLD-${building.id.slice(0, 8)}`,
    building_id: building.id,
    status: 'ativo',
    resolucao: '1920x1080',
    buildings: {
      id: building.id,
      nome: building.nome,
      endereco: building.endereco,
      bairro: building.bairro,
      cidade: building.bairro,
      estado: 'SP',
      cep: '00000-000',
      latitude: building.latitude,
      longitude: building.longitude,
      imageUrl: getImageUrl(building.imagem_principal),
      basePrice: building.preco_base,
      venue_type: building.venue_type,
      condominiumProfile: building.padrao_publico,
      audience_profile: building.caracteristicas,
      tags: building.amenities,
      towers: Math.ceil(building.quantidade_telas / 2),
      apartments: building.publico_estimado ? Math.ceil(building.publico_estimado / 3) : 100,
      status: building.status
    }
  };
};

const getImageUrl = (path: string) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${supabase.storage.from('building-images').getPublicUrl(path).data.publicUrl}`;
};

// Função auxiliar para calcular distância
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
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
