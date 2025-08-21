
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

export const fetchActiveBuildings = async (): Promise<SimpleBuildingStore[]> => {
  try {
    console.log('🏢 [SIMPLE SERVICE] === SECURE AUTHENTICATED ACCESS ===');
    
    // Use secure function that requires authentication
    const { data: buildings, error } = await supabase
      .rpc('get_buildings_for_authenticated_users');

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

    // Convert secure minimal data to SimpleBuildingStore (with restricted data for security)
    const simpleBuildingStores: SimpleBuildingStore[] = buildings.map(building => ({
      id: building.id,
      nome: building.nome,
      endereco: '', // Removed for security - no longer exposed
      cidade: '', // Not available
      estado: '', // Not available
      bairro: building.bairro,
      venue_type: building.venue_type,
      status: building.status,
      latitude: 0, // Removed for security - no longer exposed
      longitude: 0, // Removed for security - no longer exposed
      publico_estimado: 0, // Removed for security - no longer exposed
      visualizacoes_mes: 0, // Removed for security - no longer exposed
      preco_base: building.preco_base || 280,
      imagem_principal: building.imagem_principal || '',
      imagem_2: '', // Not available in minimal data
      imagem_3: '', // Not available in minimal data
      imagem_4: '', // Not available in minimal data
      imagens: [], // Not available
      amenities: [], // Removed for security - no longer exposed
      caracteristicas: [], // Removed for security - no longer exposed
      padrao_publico: 'normal' as 'alto' | 'medio' | 'normal', // Default value since removed for security
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
