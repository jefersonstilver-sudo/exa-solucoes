import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Panel } from '@/types/panel';

export interface BuildingStore {
  id: string;
  nome: string;
  endereco: string;
  cidade: string;
  estado: string;
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
  imagens: string[];
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

    // Converter dados do banco para BuildingStore
    const buildingStores: BuildingStore[] = buildings.map(building => ({
      id: building.id,
      nome: building.nome,
      endereco: building.endereco || '',
      cidade: '', // Database doesn't have this field yet
      estado: '', // Database doesn't have this field yet
      bairro: building.bairro,
      venue_type: building.venue_type,
      status: building.status,
      latitude: building.latitude,
      longitude: building.longitude,
      publico_estimado: building.publico_estimado || 0,
      visualizacoes_mes: building.visualizacoes_mes || 0,
      preco_base: building.preco_base || 280,
      imagem_principal: building.imagem_principal || '',
      imagem_2: building.imagem_2 || '',
      imagem_3: building.imagem_3 || '',
      imagem_4: building.imagem_4 || '',
      imagens: [], // Database doesn't have this field yet
      amenities: building.amenities || [],
      caracteristicas: building.caracteristicas || [],
      padrao_publico: (['alto', 'medio', 'normal'].includes(building.padrao_publico) ? building.padrao_publico : 'normal') as 'alto' | 'medio' | 'normal',
      quantidade_telas: building.quantidade_telas || 1
    }));

    return buildingStores;
    
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
  console.log('🔄 [buildingToPanel] DEPRECATED: Use convertBuildingToPanel instead');
  
  return {
    id: building.id,
    code: `panel_${building.id}`,
    building_id: building.id,
    status: 'online',
    buildings: {
      id: building.id,
      nome: building.nome,
      endereco: building.endereco || '',
      bairro: building.bairro,
      cidade: building.cidade || '',
      estado: building.estado || '',
      cep: '', // Valor padrão
      latitude: building.latitude,
      longitude: building.longitude,
      venue_type: building.venue_type,
      caracteristicas: building.caracteristicas || [],
      preco_base: building.preco_base || 280,
      quantidade_telas: building.quantidade_telas || 1,
      imagens: building.imagens || []
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
