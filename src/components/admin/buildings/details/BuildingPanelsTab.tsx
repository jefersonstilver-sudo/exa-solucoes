
import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Monitor, Plus, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import PanelCard from '../panels/PanelCard';
import SimplePanelRemovalAlert from '../panels/SimplePanelRemovalAlert';

interface BuildingPanelsTabProps {
  panels: any[];
  loading: boolean;
  onRefresh: () => void;
  onAssignPanel: () => void;
  onSyncPanel: (panelId: string) => void;
  onViewPanelDetails: (panelId: string) => void;
  buildingName?: string;
}

const BuildingPanelsTab: React.FC<BuildingPanelsTabProps> = ({
  panels,
  loading,
  onRefresh,
  onAssignPanel,
  onSyncPanel,
  onViewPanelDetails,
  buildingName = ''
}) => {
  console.log('🏢 [BUILDING PANELS TAB] Renderizando com painéis:', panels.length);

  const [removalState, setRemovalState] = useState({
    isOpen: false,
    panel: null as any,
    loading: false
  });

  const operationRef = useRef<{ inProgress: boolean; panelId?: string; operationId?: string }>({
    inProgress: false
  });

  const getPanelStatusSummary = () => {
    const summary = panels.reduce((acc, panel) => {
      acc[panel.status] = (acc[panel.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return summary;
  };

  const statusSummary = getPanelStatusSummary();

  const handleRemoveRequest = useCallback((panel: any) => {
    const operationId = `remove_${panel.id}_${Date.now()}`;
    
    console.log('🗑️ [BUILDING PANELS TAB] Solicitação de remoção:', {
      panelCode: panel.code,
      panelId: panel.id,
      operationId,
      currentState: removalState,
      operationInProgress: operationRef.current.inProgress
    });
    
    if (!panel?.id || !panel?.code) {
      console.error('❌ [BUILDING PANELS TAB] Panel inválido:', panel);
      toast.error('Erro: Dados do painel inválidos');
      return;
    }

    if (operationRef.current.inProgress) {
      console.log('⏳ [BUILDING PANELS TAB] Operação já em andamento, ignorando:', operationRef.current);
      toast.warning('Aguarde a operação anterior finalizar');
      return;
    }

    if (removalState.isOpen) {
      console.log('⚠️ [BUILDING PANELS TAB] Fechando dialog anterior antes de abrir novo');
      setRemovalState({ isOpen: false, panel: null, loading: false });
      
      setTimeout(() => {
        operationRef.current = { inProgress: false, operationId };
        setRemovalState({
          isOpen: true,
          panel: panel,
          loading: false
        });
      }, 200);
      return;
    }

    operationRef.current = { inProgress: false, panelId: panel.id, operationId };
    setRemovalState({
      isOpen: true,
      panel: panel,
      loading: false
    });
  }, [removalState]);

  const handleConfirmRemoval = useCallback(async () => {
    const { panel } = removalState;
    const currentOperation = operationRef.current;
    
    console.log('🔄 [BUILDING PANELS TAB] Iniciando confirmação de remoção:', {
      panel: panel?.code,
      panelId: panel?.id,
      currentOperation,
      buildingName
    });
    
    if (!panel?.id) {
      console.error('❌ [BUILDING PANELS TAB] Panel não encontrado para remoção');
      toast.error('Erro: Painel não encontrado');
      setRemovalState({ isOpen: false, panel: null, loading: false });
      operationRef.current.inProgress = false;
      return;
    }

    if (operationRef.current.inProgress) {
      console.log('⏳ [BUILDING PANELS TAB] Operação já em andamento');
      return;
    }

    operationRef.current.inProgress = true;
    setRemovalState(prev => ({ ...prev, loading: true }));

    try {
      // Verificar campanhas ativas
      console.log('🔍 [BUILDING PANELS TAB] Verificando campanhas ativas...');
      const { data: activeCampaigns, error: campaignsError } = await supabase
        .from('campanhas')
        .select('id')
        .eq('painel_id', panel.id)
        .in('status', ['pendente', 'ativo']);

      if (campaignsError) {
        console.error('❌ [BUILDING PANELS TAB] Erro ao verificar campanhas:', campaignsError);
        throw new Error('Erro ao verificar campanhas ativas: ' + campaignsError.message);
      }

      if (activeCampaigns && activeCampaigns.length > 0) {
        console.warn('⚠️ [BUILDING PANELS TAB] Painel tem campanhas ativas:', activeCampaigns.length);
        toast.error(`Este painel não pode ser removido pois possui ${activeCampaigns.length} campanhas ativas`);
        setRemovalState({ isOpen: false, panel: null, loading: false });
        operationRef.current.inProgress = false;
        return;
      }

      // Executar remoção
      console.log('🔄 [BUILDING PANELS TAB] Removendo atribuição do painel...');
      const { error: updateError } = await supabase
        .from('painels')
        .update({ building_id: null })
        .eq('id', panel.id);

      if (updateError) {
        throw updateError;
      }

      console.log(`✅ [BUILDING PANELS TAB] Sucesso - Operação: ${currentOperation.operationId}`);

      // Log da ação (não crítico)
      try {
        await supabase.rpc('log_building_action', {
          p_building_id: null,
          p_action_type: 'unassign_panel',
          p_description: `Painel "${panel.code}" removido do prédio "${buildingName}" - Operação: ${currentOperation.operationId}`,
          p_old_values: { panel_id: panel.id, panel_code: panel.code, building_name: buildingName }
        });
        console.log('📝 [BUILDING PANELS TAB] Log da ação registrado');
      } catch (logError) {
        console.warn('⚠️ [BUILDING PANELS TAB] Falha ao registrar log (não crítico):', logError);
      }

      toast.success(`Painel "${panel.code}" removido com sucesso!`);
      
      // Fechar dialog e resetar estados
      setRemovalState({ isOpen: false, panel: null, loading: false });
      operationRef.current.inProgress = false;
      
      // Atualizar lista
      setTimeout(() => {
        console.log('🔄 [BUILDING PANELS TAB] Atualizando lista de painéis após remoção');
        onRefresh();
      }, 300);
      
    } catch (error) {
      console.error('💥 [BUILDING PANELS TAB] Erro crítico na remoção:', error);
      toast.error('Erro ao remover painel: ' + (error as any)?.message || 'Erro desconhecido');
      setRemovalState({ isOpen: false, panel: null, loading: false });
      operationRef.current.inProgress = false;
    }
  }, [removalState.panel, buildingName, onRefresh]);

  const handleCloseAlert = useCallback((open: boolean) => {
    console.log('🔄 [BUILDING PANELS TAB] Fechando alert de remoção:', {
      open,
      operationInProgress: operationRef.current.inProgress,
      loading: removalState.loading,
      currentPanel: removalState.panel?.code
    });
    
    if (!open) {
      // Só fechar se não há operação em andamento
      if (!operationRef.current.inProgress && !removalState.loading) {
        setRemovalState({ isOpen: false, panel: null, loading: false });
        operationRef.current = { inProgress: false };
      } else {
        console.log('⏳ [BUILDING PANELS TAB] Não é possível fechar dialog - operação em andamento');
      }
    }
  }, [removalState.loading]);

  const isGlobalOperationInProgress = operationRef.current.inProgress || loading;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Monitor className="h-5 w-5 mr-2" />
              Painéis Atribuídos ({panels.length})
            </div>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onRefresh}
                disabled={isGlobalOperationInProgress}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                size="sm"
                onClick={onAssignPanel}
                disabled={isGlobalOperationInProgress}
                className="bg-indexa-purple hover:bg-indexa-purple-dark"
              >
                <Plus className="h-4 w-4 mr-1" />
                Atribuir Painel
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Resumo de Status */}
          {panels.length > 0 && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-3">Status dos Painéis</h4>
              <div className="flex flex-wrap gap-4">
                {statusSummary.online && (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Online: {statusSummary.online}</span>
                  </div>
                )}
                {statusSummary.offline && (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm">Offline: {statusSummary.offline}</span>
                  </div>
                )}
                {statusSummary.maintenance && (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm">Manutenção: {statusSummary.maintenance}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Lista de Painéis */}
          {panels.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {panels.map((panel: any) => (
                <PanelCard
                  key={panel.id}
                  panel={panel}
                  onRemove={handleRemoveRequest}
                  onSync={onSyncPanel}
                  onViewDetails={onViewPanelDetails}
                  disabled={isGlobalOperationInProgress}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Monitor className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum painel atribuído
              </h3>
              <p className="text-gray-500 mb-4">
                Este prédio ainda não possui painéis atribuídos.
              </p>
              <Button
                onClick={onAssignPanel}
                disabled={isGlobalOperationInProgress}
                className="bg-indexa-purple hover:bg-indexa-purple-dark"
              >
                <Plus className="h-4 w-4 mr-1" />
                Atribuir Primeiro Painel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AlertDialog unificado para confirmação de remoção */}
      <SimplePanelRemovalAlert
        open={removalState.isOpen}
        onOpenChange={handleCloseAlert}
        panelCode={removalState.panel?.code || ''}
        buildingName={buildingName}
        onConfirm={handleConfirmRemoval}
        loading={removalState.loading}
      />
    </div>
  );
};

export default BuildingPanelsTab;
