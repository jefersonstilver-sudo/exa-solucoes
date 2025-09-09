
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SimpleBuildingStore {
  id: string;
  nome: string;
  endereco: string;
  cidade?: string;
  estado?: string;
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
  imagens?: string[];
  amenities: string[];
  caracteristicas: string[];
  padrao_publico: 'alto' | 'medio' | 'normal';
  quantidade_telas: number;
}

// Helper to extract bairro do endereço quando estiver ausente
const extractNeighborhoodFromEndereco = (endereco?: string): string => {
  if (!endereco) return '';
  const match = endereco.match(/-\s*([^,]+)\s*,/);
  if (match?.[1]) return match[1].trim();
  const parts = endereco.split(' - ');
  if (parts.length > 1) {
    const afterDash = parts[parts.length - 1];
    const candidate = afterDash.split(',')[0]?.trim();
    if (candidate) return candidate;
  }
  return '';
};

export const fetchActiveBuildings = async (): Promise<SimpleBuildingStore[]> => {
  try {
    console.log('🏢 [SIMPLE SERVICE] === PUBLIC STORE ACCESS ===');
    
    // Use public function for store (now returns ALL buildings regardless of coordinates)
    const { data: buildings, error } = await supabase
      .rpc('get_buildings_for_public_store');

    if (error) {
      console.error('❌ [SIMPLE SERVICE] Erro na query:', error);
      throw new Error(`Erro ao buscar prédios: ${error.message}`);
    }

    if (!buildings || buildings.length === 0) {
      console.warn('⚠️ [SIMPLE SERVICE] Nenhum prédio ativo encontrado');
      return [];
    }

    console.log('✅ [SIMPLE SERVICE] Prédios ativos encontrados:', buildings.length);
    
    // Log detalhado dos prédios
    buildings.forEach((building, index) => {
      console.log(`🏢 [SIMPLE SERVICE] Prédio ${index + 1}:`, {
        id: building.id,
        nome: building.nome,
        bairro: building.bairro,
        status: building.status,
        preco_base: building.preco_base,
        quantidade_telas: building.quantidade_telas
      });
      
      // Log específico para Rio Negro
      if (building.nome === 'Rio Negro') {
        console.log(`🎯 [SIMPLE SERVICE] RIO NEGRO ENCONTRADO - Preço: R$ ${building.preco_base}`);
      }
    });

    // Convert public store data to SimpleBuildingStore (now with coordinates for map)
    const simpleBuildingStores: SimpleBuildingStore[] = buildings.map(building => ({
      id: building.id,
      nome: building.nome,
      endereco: building.endereco || '', // Now available from public store
      cidade: '', // Not available
      estado: '', // Not available
      bairro: building.bairro || extractNeighborhoodFromEndereco(building.endereco) || 'Bairro não definido',
      venue_type: building.venue_type,
      status: building.status,
      latitude: Number(building.latitude) || 0, // Now available for map functionality
      longitude: Number(building.longitude) || 0, // Now available for map functionality
      publico_estimado: building.publico_estimado || 0, // Now available from database
      visualizacoes_mes: 0, // Not exposed publicly for security
      preco_base: building.preco_base || 280,
      imagem_principal: building.imagem_principal || '',
      imagem_2: '', // Not available in public data
      imagem_3: '', // Not available in public data
      imagem_4: '', // Not available in public data
      imagens: [], // Not available
      amenities: building.amenities || [], // Now available from public store
      caracteristicas: building.caracteristicas || [], // Now available from public store
      padrao_publico: 'normal' as 'alto' | 'medio' | 'normal', // Default value for security
      quantidade_telas: building.quantidade_telas || 1
    }));

    // Log final para verificar os preços processados
    const rioNegroBuilding = simpleBuildingStores.find(b => b.nome === 'Rio Negro');
    if (rioNegroBuilding) {
      console.log(`🎯 [SIMPLE SERVICE] RIO NEGRO PROCESSADO - Preço final: R$ ${rioNegroBuilding.preco_base}`);
    }

    return simpleBuildingStores;
    
  } catch (error: any) {
    console.error('💥 [SIMPLE SERVICE] Erro crítico:', error);
    toast.error('Erro crítico ao carregar prédios');
    return [];
  }
};
