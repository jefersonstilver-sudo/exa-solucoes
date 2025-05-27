
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SimpleBuildingStore {
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

export const fetchActiveBuildings = async (): Promise<SimpleBuildingStore[]> => {
  try {
    console.log('🏢 [SIMPLE SERVICE] === BUSCANDO PRÉDIOS ATIVOS ===');
    
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
    });

    return buildings as SimpleBuildingStore[];
    
  } catch (error: any) {
    console.error('💥 [SIMPLE SERVICE] Erro crítico:', error);
    toast.error('Erro crítico ao carregar prédios');
    return [];
  }
};
