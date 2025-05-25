
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useSharedPanelOperations = () => {
  const [loading, setLoading] = useState(false);
  const operationRef = useRef<{ inProgress: boolean }>({ inProgress: false });

  const removePanel = useCallback(async (panelId: string, panelCode: string, buildingName?: string) => {
    if (operationRef.current.inProgress) {
      console.log('⏳ [SHARED PANEL OPERATIONS] Operação já em andamento');
      toast.warning('Aguarde a operação anterior finalizar');
      return false;
    }

    operationRef.current.inProgress = true;
    setLoading(true);

    try {
      console.log('🔍 [SHARED PANEL OPERATIONS] Verificando campanhas ativas para painel:', panelCode);
      
      const { data: activeCampaigns, error: campaignsError } = await supabase
        .from('campanhas')
        .select('id')
        .eq('painel_id', panelId)
        .in('status', ['pendente', 'ativo']);

      if (campaignsError) {
        throw new Error('Erro ao verificar campanhas ativas: ' + campaignsError.message);
      }

      if (activeCampaigns && activeCampaigns.length > 0) {
        toast.error(`Este painel não pode ser removido pois possui ${activeCampaigns.length} campanhas ativas`);
        return false;
      }

      console.log('🔄 [SHARED PANEL OPERATIONS] Removendo atribuição do painel...');
      const { error: updateError } = await supabase
        .from('painels')
        .update({ building_id: null })
        .eq('id', panelId);

      if (updateError) {
        throw updateError;
      }

      // Log da ação
      try {
        await supabase.rpc('log_building_action', {
          p_building_id: null,
          p_action_type: 'unassign_panel',
          p_description: `Painel "${panelCode}" removido do prédio "${buildingName || 'N/A'}"`,
          p_old_values: { panel_id: panelId, panel_code: panelCode, building_name: buildingName }
        });
      } catch (logError) {
        console.warn('⚠️ [SHARED PANEL OPERATIONS] Falha ao registrar log (não crítico):', logError);
      }

      toast.success(`Painel "${panelCode}" removido com sucesso!`);
      return true;

    } catch (error) {
      console.error('💥 [SHARED PANEL OPERATIONS] Erro na remoção:', error);
      toast.error('Erro ao remover painel: ' + (error as any)?.message || 'Erro desconhecido');
      return false;
    } finally {
      setLoading(false);
      operationRef.current.inProgress = false;
    }
  }, []);

  const syncPanel = useCallback(async (panelId: string) => {
    try {
      console.log('🔄 [SHARED PANEL OPERATIONS] Sync do painel:', panelId);
      toast.info('Funcionalidade de sincronização em desenvolvimento');
    } catch (error) {
      console.error('❌ [SHARED PANEL OPERATIONS] Erro no sync:', error);
      toast.error('Erro na sincronização do painel');
    }
  }, []);

  const viewPanelDetails = useCallback((panelId: string) => {
    console.log('👁️ [SHARED PANEL OPERATIONS] Visualizar detalhes do painel:', panelId);
    toast.info('Funcionalidade de detalhes em desenvolvimento');
  }, []);

  return {
    loading,
    removePanel,
    syncPanel,
    viewPanelDetails,
    isOperationInProgress: operationRef.current.inProgress
  };
};
