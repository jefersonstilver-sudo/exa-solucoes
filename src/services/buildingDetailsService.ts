
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BuildingDetailsData {
  actionLogs: any[];
  sales: any[];
  panels: any[];
}

export const fetchBuildingActionLogs = async (buildingId: string) => {
  console.log('🔍 [BUILDING DETAILS SERVICE] Buscando logs para prédio ID:', buildingId);
  
  const { data: logsData } = await supabase
    .from('building_action_logs')
    .select(`
      *,
      users:user_id (email)
    `)
    .eq('building_id', buildingId)
    .order('created_at', { ascending: false })
    .limit(20);

  return logsData || [];
};

export const fetchBuildingSales = async (buildingId: string) => {
  console.log('🔍 [BUILDING DETAILS SERVICE] Buscando vendas para prédio ID:', buildingId);
  
  const { data: salesData } = await supabase
    .from('pedidos')
    .select('*')
    .contains('lista_paineis', [buildingId])
    .order('created_at', { ascending: false });

  return salesData || [];
};

export const fetchBuildingPanels = async (buildingId: string) => {
  console.log('🔍 [BUILDING DETAILS SERVICE] Buscando painéis para prédio ID:', buildingId);
  
  const { data: panelsData, error: panelsError } = await supabase
    .from('painels')
    .select('*')
    .eq('building_id', buildingId)
    .order('code');

  if (panelsError) {
    console.error('❌ [BUILDING DETAILS SERVICE] Erro ao buscar painéis:', panelsError);
    toast.error('Erro ao carregar painéis do prédio');
    throw panelsError;
  }

  console.log('✅ [BUILDING DETAILS SERVICE] Painéis carregados:', panelsData?.length || 0);
  return panelsData || [];
};

export const fetchAllBuildingData = async (buildingId: string): Promise<BuildingDetailsData> => {
  if (!buildingId) {
    console.error('❌ [BUILDING DETAILS SERVICE] ID do prédio não encontrado');
    throw new Error('ID do prédio é obrigatório');
  }
  
  try {
    console.log('🔍 [BUILDING DETAILS SERVICE] Buscando dados para prédio ID:', buildingId);

    const [actionLogs, sales, panels] = await Promise.all([
      fetchBuildingActionLogs(buildingId),
      fetchBuildingSales(buildingId),
      fetchBuildingPanels(buildingId)
    ]);

    return {
      actionLogs,
      sales,
      panels
    };
  } catch (error) {
    console.error('💥 [BUILDING DETAILS SERVICE] Erro ao carregar dados:', error);
    toast.error('Erro ao carregar dados do prédio');
    throw error;
  }
};
