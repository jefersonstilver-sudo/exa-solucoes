
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
 * Converte um BuildingStore em Panel para compatibilidade com o carrinho
 */
export const buildingToPanel = (building: BuildingStore): Panel => {
  return {
    id: building.id,
    code: `BLD-${building.id.slice(0, 8)}`, // Gerar código baseado no ID
    building_id: building.id,
    status: 'ativo',
    resolucao: '1920x1080', // Valor padrão
    buildings: {
      id: building.id,
      nome: building.nome,
      endereco: building.endereco,
      bairro: building.bairro,
      cidade: building.bairro, // Usando bairro como cidade por compatibilidade
      estado: 'SP', // Valor padrão
      cep: '00000-000', // Valor padrão
      latitude: building.latitude,
      longitude: building.longitude,
      imageUrl: getImageUrl(building.imagem_principal),
      basePrice: building.preco_base,
      venue_type: building.venue_type,
      condominiumProfile: building.padrao_publico,
      audience_profile: building.caracteristicas,
      tags: building.amenities,
      towers: Math.ceil(building.quantidade_telas / 2), // Estimativa
      apartments: building.publico_estimado ? Math.ceil(building.publico_estimado / 3) : 100, // Estimativa
      status: building.status
    }
  };
};

const getImageUrl = (path: string) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${supabase.storage.from('building-images').getPublicUrl(path).data.publicUrl}`;
};

export const fetchBuildingsForStore = async (lat?: number, lng?: number, radius = 5000) => {
  try {
    console.log('🏢 [BUILDING STORE] Buscando prédios para loja pública...');
    console.log('🏢 [BUILDING STORE] Parâmetros:', { lat, lng, radius });
    
    // CORREÇÃO CRÍTICA: Query pública - sem verificação de autenticação
    // RLS agora permite acesso público a prédios ativos
    let query = supabase
      .from('buildings')
      .select('*')
      .eq('status', 'ativo') // Apenas prédios ativos são acessíveis publicamente
      .order('created_at', { ascending: false });

    console.log('🏢 [BUILDING STORE] Executando query pública para prédios ativos...');
    const { data: buildings, error } = await query;

    if (error) {
      console.error('❌ [BUILDING STORE] Erro na query pública:', error);
      toast.error(`Erro ao carregar prédios: ${error.message}`);
      return [];
    }

    if (!buildings || buildings.length === 0) {
      console.warn('⚠️ [BUILDING STORE] Nenhum prédio ativo encontrado publicamente');
      return [];
    }

    console.log('✅ [BUILDING STORE] Prédios encontrados publicamente:', buildings.length);
    
    // Log detalhado dos prédios encontrados
    buildings.forEach(building => {
      console.log('🏢 [BUILDING STORE] Prédio público:', {
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

    // Se há coordenadas, calcular distância e filtrar por raio
    if (lat && lng && buildings) {
      console.log('📍 [BUILDING STORE] Calculando distâncias...');
      
      const buildingsWithDistance = buildings.map((building: any) => {
        if (building.latitude && building.longitude) {
          const distance = getDistanceFromLatLonInKm(lat, lng, building.latitude, building.longitude) * 1000;
          console.log(`📏 [BUILDING STORE] Distância para ${building.nome}: ${distance}m`);
          return { ...building, distance };
        }
        console.log(`⚠️ [BUILDING STORE] ${building.nome} sem coordenadas`);
        return { ...building, distance: 999999 };
      });

      // Filtrar por raio
      const filteredBuildings = buildingsWithDistance.filter(building => {
        const withinRadius = building.distance <= radius;
        console.log(`📍 [BUILDING STORE] ${building.nome} dentro do raio (${radius}m): ${withinRadius}`);
        return withinRadius;
      });
      
      console.log(`✅ [BUILDING STORE] ${filteredBuildings.length} prédios dentro do raio de ${radius}m`);
      return filteredBuildings.sort((a, b) => a.distance - b.distance);
    }

    console.log('✅ [BUILDING STORE] Retornando todos os prédios ativos públicos:', buildings.length);
    return buildings || [];
    
  } catch (error: any) {
    console.error('💥 [BUILDING STORE] Erro crítico na busca pública:', error);
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
