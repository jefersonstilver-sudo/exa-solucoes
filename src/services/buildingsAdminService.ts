
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { buildImageUrlsArray } from './buildingsDataService';

export interface AdminBuilding {
  id: string;
  nome: string;
  endereco: string;
  bairro: string;
  status: string;
  venue_type: string;
  monthly_traffic: number;
  latitude: number;
  longitude: number;
  numero_unidades: number;
  publico_estimado: number;
  preco_base: number;
  image_urls: string[];
  amenities: string[];
  padrao_publico: 'alto' | 'medio' | 'normal';
  quantidade_telas: number;
  visualizacoes_mes: number;
  imagem_principal: string;
  imagem_2: string;
  imagem_3: string;
  imagem_4: string;
  caracteristicas: string[];
  created_at: string;
  nome_sindico: string;
  contato_sindico: string;
  nome_vice_sindico: string;
  contato_vice_sindico: string;
  nome_contato_predio: string;
  numero_contato_predio: string;
}

export const fetchAllBuildingsForAdmin = async () => {
  try {
    console.log('🏢 [ADMIN BUILDINGS SERVICE] Iniciando busca de TODOS os prédios para administração...');
    
    // Query para buscar TODOS os prédios (ativos E inativos) para administração
    const buildingsPromise = supabase
      .from('buildings')
      .select('*')
      .order('created_at', { ascending: false });

    const panelsPromise = supabase
      .from('painels')
      .select('building_id');

    // Implementar timeout de 10 segundos
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout na busca de dados')), 10000);
    });

    const [buildingsResult, panelsResult] = await Promise.race([
      Promise.all([buildingsPromise, panelsPromise]),
      timeoutPromise
    ]) as any;

    const { data: buildingsData, error: buildingsError } = buildingsResult;
    const { data: panelsData, error: panelsError } = panelsResult;

    if (buildingsError) {
      console.error('❌ [ADMIN BUILDINGS SERVICE] Erro ao buscar prédios:', buildingsError);
      toast.error(`Erro ao carregar prédios: ${buildingsError.message}`);
      return { buildings: [], panels: [] };
    }

    console.log('✅ [ADMIN BUILDINGS SERVICE] Prédios carregados para administração:', {
      total: buildingsData?.length || 0,
      ativos: buildingsData?.filter((b: any) => b.status === 'ativo').length || 0,
      inativos: buildingsData?.filter((b: any) => b.status === 'inativo').length || 0
    });

    if (panelsError) {
      console.error('⚠️ [ADMIN BUILDINGS SERVICE] Erro ao buscar painéis (não crítico):', panelsError);
    }

    return {
      buildings: buildingsData || [],
      panels: panelsData || []
    };
  } catch (error: any) {
    console.error('💥 [ADMIN BUILDINGS SERVICE] Erro crítico ao carregar prédios:', error);
    
    if (error.message === 'Timeout na busca de dados') {
      toast.error('Timeout ao carregar dados. Tente novamente.');
    } else {
      toast.error('Erro crítico. Verifique sua conexão e tente novamente.');
    }
    
    return { buildings: [], panels: [] };
  }
};
