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
  manual_latitude?: number;
  manual_longitude?: number;
  position_validated?: boolean;
  publico_estimado: number;
  visualizacoes_mes: number;
  preco_base: number;
  imagem_principal: string;
  imagem_principal_focus?: { x: number; y: number };
  imagem_2: string;
  imagem_2_focus?: { x: number; y: number };
  imagem_3: string;
  imagem_3_focus?: { x: number; y: number };
  imagem_4: string;
  imagem_4_focus?: { x: number; y: number };
  imagens: string[];
  amenities: string[];
  caracteristicas: string[];
  padrao_publico: 'alto' | 'medio' | 'normal';
  quantidade_telas: number;
  numero_elevadores: number; // Número de telas (campo renomeado)
}

/**
 * VERSÃO SIMPLIFICADA E CONFIÁVEL
 */

// Helper para extrair bairro do endereço quando ausente
const extractNeighborhoodFromEndereco = (endereco?: string): string => {
  if (!endereco) return '';
  
  console.log('🔍 [EXTRACTION] Processando endereço:', endereco);
  
  // Normalizar diferentes tipos de travessão para hífen padrão
  const normalized = endereco.replace(/[–—−]/g, '-');
  
  // Padrão: "Rua/Avenida Nome, Número - Bairro, Cidade"
  // Buscar padrão: qualquer coisa, vírgula, espaços, número, espaços, hífen, espaços, bairro
  const pattern1 = /,\s*\d+[a-zA-Z]?\s*[-–—−]\s*([^,]+)\s*,/;
  const match1 = normalized.match(pattern1);
  if (match1?.[1]) {
    const extracted = match1[1].trim();
    console.log('✅ [EXTRACTION] Padrão 1 - Bairro extraído:', extracted);
    return extracted;
  }
  
  // Padrão alternativo: "Nome - Bairro, Cidade"
  const pattern2 = /[-–—−]\s*([^,]+)\s*,/;
  const match2 = normalized.match(pattern2);
  if (match2?.[1]) {
    const extracted = match2[1].trim();
    console.log('✅ [EXTRACTION] Padrão 2 - Bairro extraído:', extracted);
    return extracted;
  }
  
  // Fallback: dividir por hífen e pegar a primeira parte após o último hífen
  const parts = normalized.split(/-/);
  if (parts.length > 1) {
    const afterDash = parts[parts.length - 1];
    const candidate = afterDash.split(',')[0]?.trim();
    if (candidate) {
      console.log('✅ [EXTRACTION] Fallback - Bairro extraído:', candidate);
      return candidate;
    }
  }
  
  console.log('❌ [EXTRACTION] Nenhum bairro encontrado');
  return '';
};

export const fetchBuildingsForStore = async (): Promise<BuildingStore[]> => {
  try {
    console.log('🏢 [BUILDING STORE SERVICE] === SECURE VERSION ===');
    
    // Use public function for store (returns coords for map without requiring auth)
    let { data: buildings, error } = await supabase
      .rpc('get_buildings_for_public_store');

    // Fallback to authenticated function if public one fails
    if (error) {
      console.warn('⚠️ [BUILDING STORE SERVICE] Public RPC falhou, tentando authenticated:', error);
      const fallback = await supabase.rpc('get_buildings_for_authenticated_users');
      buildings = fallback.data as any;
      error = fallback.error as any;
    }

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
        quantidade_telas: building.quantidade_telas,
        preco_base: building.preco_base
      });
    });

    // Convert secure minimal data to BuildingStore (with restricted data)
    const buildingStores: BuildingStore[] = buildings.map(building => ({
      id: building.id,
      nome: building.nome,
      endereco: building.endereco || '',
      cidade: '',
      estado: '',
      bairro: building.bairro || extractNeighborhoodFromEndereco(building.endereco) || 'Bairro não definido',
      venue_type: building.venue_type,
      status: building.status,
      latitude: Number((building as any).latitude),
      longitude: Number((building as any).longitude),
      manual_latitude: undefined,
      manual_longitude: undefined,
      position_validated: undefined,
      publico_estimado: building.publico_estimado || 0,
      visualizacoes_mes: (building as any).visualizacoes_mes || 0,
      preco_base: Number(building.preco_base) || 280,
      imagem_principal: building.imagem_principal || '',
      imagem_2: '',
      imagem_3: '',
      imagem_4: '',
      imagens: [],
      amenities: [],
      caracteristicas: [],
      padrao_publico: 'normal' as 'alto' | 'medio' | 'normal',
      quantidade_telas: building.quantidade_telas || 1,
      numero_elevadores: (building as any).numero_elevadores || 0
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

export const getImageUrl = (path: string) => {
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