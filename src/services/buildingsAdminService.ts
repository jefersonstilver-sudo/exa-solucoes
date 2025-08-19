
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
  numero_andares: number;
  numero_elevadores: number;
  numero_blocos: number;
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
  paineis_ativos: number;
  vendas_mes_atual: number;
}

export const fetchAllBuildingsForAdmin = async () => {
  try {
    console.log('🏢 [ADMIN BUILDINGS SERVICE] Iniciando busca de TODOS os prédios para administração...');
    
    // Use secure function that excludes sensitive contact information by default
    const buildingsPromise = supabase.rpc('get_admin_buildings_safe');

    // Buscar painéis ativos por prédio
    const panelsPromise = supabase
      .from('painels')
      .select('building_id, status')
      .eq('status', 'online');

    // Buscar vendas do mês atual por prédio
    const currentMonth = new Date();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    
    const salesPromise = supabase
      .from('pedidos')
      .select('lista_predios')
      .in('status', ['pago', 'ativo', 'video_aprovado', 'pago_pendente_video'])
      .gte('created_at', firstDayOfMonth.toISOString());

    // Implementar timeout de 10 segundos
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout na busca de dados')), 10000);
    });

    const [buildingsResult, panelsResult, salesResult] = await Promise.race([
      Promise.all([buildingsPromise, panelsPromise, salesPromise]),
      timeoutPromise
    ]) as any;

    const { data: buildingsData, error: buildingsError } = buildingsResult;
    const { data: panelsData, error: panelsError } = panelsResult;
    const { data: salesData, error: salesError } = salesResult;

    if (buildingsError) {
      console.error('❌ [ADMIN BUILDINGS SERVICE] Erro ao buscar prédios:', buildingsError);
      toast.error(`Erro ao carregar prédios: ${buildingsError.message}`);
      return { buildings: [], panels: [] };
    }

    // Processar dados dos painéis ativos
    const activePanelsByBuilding = (panelsData || []).reduce((acc: any, panel: any) => {
      if (panel.building_id) {
        acc[panel.building_id] = (acc[panel.building_id] || 0) + 1;
      }
      return acc;
    }, {});

    // Processar dados das vendas do mês
    const salesByBuilding = (salesData || []).reduce((acc: any, pedido: any) => {
      if (pedido.lista_predios && Array.isArray(pedido.lista_predios)) {
        pedido.lista_predios.forEach((buildingId: string) => {
          acc[buildingId] = (acc[buildingId] || 0) + 1;
        });
      }
      return acc;
    }, {});

    // Enriquecer dados dos prédios com as novas métricas
    const enrichedBuildings = (buildingsData || []).map((building: any) => ({
      ...building,
      paineis_ativos: activePanelsByBuilding[building.id] || 0,
      vendas_mes_atual: salesByBuilding[building.id] || 0
    }));

    console.log('✅ [ADMIN BUILDINGS SERVICE] Prédios carregados para administração:', {
      total: enrichedBuildings.length,
      ativos: enrichedBuildings.filter((b: any) => b.status === 'ativo').length,
      inativos: enrichedBuildings.filter((b: any) => b.status === 'inativo').length
    });

    if (panelsError) {
      console.error('⚠️ [ADMIN BUILDINGS SERVICE] Erro ao buscar painéis (não crítico):', panelsError);
    }

    if (salesError) {
      console.error('⚠️ [ADMIN BUILDINGS SERVICE] Erro ao buscar vendas (não crítico):', salesError);
    }

    return {
      buildings: enrichedBuildings,
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
