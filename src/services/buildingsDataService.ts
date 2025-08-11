
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Building {
  id: string;
  nome: string;
  endereco: string;
  bairro: string;
  status: string;
  venue_type: string; // Campo correto no banco
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

export const buildImageUrlsArray = (building: any) => {
  const urls = [];
  if (building.imagem_principal) urls.push(building.imagem_principal);
  if (building.imagem_2) urls.push(building.imagem_2);
  if (building.imagem_3) urls.push(building.imagem_3);
  if (building.imagem_4) urls.push(building.imagem_4);
  return urls;
};

export const fetchBuildingsData = async () => {
  try {
    console.log('🏢 [BUILDINGS DATA SERVICE] Iniciando busca de prédios para acesso público...');
    
    // Consulta segura via função RPC (sem expor dados sensíveis)
    const buildingsPromise = supabase
      .rpc('get_public_buildings');

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
      console.error('❌ [BUILDINGS DATA SERVICE] Erro ao buscar prédios:', buildingsError);
      toast.error(`Erro ao carregar prédios: ${buildingsError.message}`);
      return { buildings: [], panels: [] };
    }

    console.log('✅ [BUILDINGS DATA SERVICE] Prédios carregados para acesso público:', buildingsData?.length || 0);

    if (panelsError) {
      console.error('⚠️ [BUILDINGS DATA SERVICE] Erro ao buscar painéis (não crítico):', panelsError);
    }

    return {
      buildings: buildingsData || [],
      panels: panelsData || []
    };
  } catch (error: any) {
    console.error('💥 [BUILDINGS DATA SERVICE] Erro crítico ao carregar prédios:', error);
    
    if (error.message === 'Timeout na busca de dados') {
      toast.error('Timeout ao carregar dados. Tente novamente.');
    } else {
      toast.error('Erro crítico. Verifique sua conexão e tente novamente.');
    }
    
    return { buildings: [], panels: [] };
  }
};
