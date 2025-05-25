
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseBuildingDetailsDataProps {
  building?: any;
  open: boolean;
}

export const useBuildingDetailsData = ({ building, open }: UseBuildingDetailsDataProps) => {
  const [actionLogs, setActionLogs] = useState([]);
  const [sales, setSales] = useState([]);
  const [panels, setPanels] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (building && open) {
      console.log('🏢 [BUILDING DETAILS] Carregando dados do prédio:', building.nome);
      fetchBuildingData();
    }
  }, [building, open]);

  const fetchBuildingData = async () => {
    if (!building?.id) {
      console.error('❌ [BUILDING DETAILS] ID do prédio não encontrado');
      return;
    }
    
    setLoading(true);
    try {
      console.log('🔍 [BUILDING DETAILS] Buscando dados para prédio ID:', building.id);

      // Buscar logs de ações
      const { data: logsData } = await supabase
        .from('building_action_logs')
        .select(`
          *,
          users:user_id (email)
        `)
        .eq('building_id', building.id)
        .order('created_at', { ascending: false })
        .limit(20);

      setActionLogs(logsData || []);

      // Buscar vendas/pedidos relacionados ao prédio
      const { data: salesData } = await supabase
        .from('pedidos')
        .select('*')
        .contains('lista_paineis', [building.id])
        .order('created_at', { ascending: false });

      setSales(salesData || []);

      // Buscar painéis do prédio
      const { data: panelsData, error: panelsError } = await supabase
        .from('painels')
        .select('*')
        .eq('building_id', building.id)
        .order('code');

      if (panelsError) {
        console.error('❌ [BUILDING DETAILS] Erro ao buscar painéis:', panelsError);
        toast.error('Erro ao carregar painéis do prédio');
      } else {
        console.log('✅ [BUILDING DETAILS] Painéis carregados:', panelsData?.length || 0);
        setPanels(panelsData || []);
      }

    } catch (error) {
      console.error('💥 [BUILDING DETAILS] Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados do prédio');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncPanel = async (panelId: string) => {
    if (!panelId) {
      toast.error('ID do painel inválido');
      return;
    }

    try {
      console.log('🔄 [BUILDING DETAILS] Sincronizando painel:', panelId);
      
      const { error } = await supabase
        .from('painels')
        .update({ ultima_sync: new Date().toISOString() })
        .eq('id', panelId);

      if (error) throw error;

      toast.success('Painel sincronizado com sucesso!');
      fetchBuildingData();
    } catch (error) {
      console.error('❌ [BUILDING DETAILS] Erro ao sincronizar painel:', error);
      toast.error('Erro ao sincronizar painel');
    }
  };

  const handleViewPanelDetails = (panelId: string) => {
    if (!panelId) {
      toast.error('ID do painel inválido');
      return;
    }
    
    console.log('👁️ [BUILDING DETAILS] Visualizar detalhes do painel:', panelId);
    toast.info('Funcionalidade de detalhes do painel em desenvolvimento');
  };

  return {
    actionLogs,
    sales,
    panels,
    loading,
    fetchBuildingData,
    handleSyncPanel,
    handleViewPanelDetails
  };
};
