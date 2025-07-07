
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
    console.log('🏢 [SIMPLE SERVICE] === BUSCANDO PRÉDIOS ATIVOS ===');
    
    // Força uma nova consulta sem cache
    const { data: buildings, error } = await supabase
      .from('buildings')
      .select('*')
      .eq('status', 'ativo')
      .order('created_at', { ascending: false });

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

    // Converter dados do banco para SimpleBuildingStore
    const simpleBuildingStores: SimpleBuildingStore[] = buildings.map(building => ({
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
