
import React, { useState, useCallback } from 'react';
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
  onRemovePanel: (panel: any) => void;
  onSyncPanel: (panelId: string) => void;
  onViewPanelDetails: (panelId: string) => void;
  buildingName?: string;
}

const BuildingPanelsTab: React.FC<BuildingPanelsTabProps> = ({
  panels,
  loading,
  onRefresh,
  onAssignPanel,
  onRemovePanel,
  onSyncPanel,
  onViewPanelDetails,
  buildingName = ''
}) => {
  console.log('🏢 [BUILDING PANELS TAB] Renderizando com painéis:', panels);

  const [removalState, setRemovalState] = useState({
    isOpen: false,
    panel: null as any,
    loading: false
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
    console.log('🗑️ [BUILDING PANELS TAB] Solicitação de remoção:', panel);
    
    if (!panel?.id) {
      console.error('❌ [BUILDING PANELS TAB] Panel inválido:', panel);
      toast.error('Erro: Dados do painel inválidos');
      return;
    }

    setRemovalState({
      isOpen: true,
      panel: panel,
      loading: false
    });
  }, []);

  const handleConfirmRemoval = useCallback(async () => {
    const { panel } = removalState;
    
    if (!panel?.id) {
      console.error('❌ [BUILDING PANELS TAB] Panel não encontrado');
      toast.error('Erro: Painel não encontrado');
      return;
    }

    console.log('🔄 [BUILDING PANELS TAB] Iniciando remoção:', panel.code);
    
    setRemovalState(prev => ({ ...prev, loading: true }));

    try {
      // Verificar campanhas ativas
      const { data: activeCampaigns, error: campaignsError } = await supabase
        .from('campanhas')
        .select('id')
        .eq('painel_id', panel.id)
        .in('status', ['pendente', 'ativo']);

      if (campaignsError) {
        console.error('❌ [BUILDING PANELS TAB] Erro ao verificar campanhas:', campaignsError);
        throw campaignsError;
      }

      if (activeCampaigns && activeCampaigns.length > 0) {
        console.warn('⚠️ [BUILDING PANELS TAB] Painel tem campanhas ativas');
        toast.error('Este painel não pode ser removido pois está sendo usado em campanhas ativas');
        return;
      }

      // Tentar com retry
      let success = false;
      let attempts = 0;
      const maxAttempts = 3;

      while (!success && attempts < maxAttempts) {
        attempts++;
        console.log(`🔄 [BUILDING PANELS TAB] Tentativa ${attempts}/${maxAttempts}`);

        try {
          const { error: updateError } = await supabase
            .from('painels')
            .update({ building_id: null })
            .eq('id', panel.id);

          if (updateError) {
            console.error(`❌ [BUILDING PANELS TAB] Tentativa ${attempts} falhou:`, updateError);
            if (attempts === maxAttempts) {
              throw updateError;
            }
            // Aguardar antes da próxima tentativa
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
          } else {
            success = true;
            console.log(`✅ [BUILDING PANELS TAB] Sucesso na tentativa ${attempts}`);
          }
        } catch (error) {
          console.error(`💥 [BUILDING PANELS TAB] Erro na tentativa ${attempts}:`, error);
          if (attempts === maxAttempts) {
            throw error;
          }
        }
      }

      // Log da ação
      try {
        await supabase.rpc('log_building_action', {
          p_building_id: null,
          p_action_type: 'unassign_panel',
          p_description: `Painel "${panel.code}" removido do prédio "${buildingName}"`,
          p_old_values: { panel_id: panel.id, panel_code: panel.code }
        });
        console.log('📝 [BUILDING PANELS TAB] Log registrado');
      } catch (logError) {
        console.warn('⚠️ [BUILDING PANELS TAB] Falha ao registrar log:', logError);
      }

      toast.success(`Painel "${panel.code}" removido com sucesso!`);
      
      // Fechar dialog e atualizar dados
      setRemovalState({ isOpen: false, panel: null, loading: false });
      onRefresh();
      
    } catch (error) {
      console.error('💥 [BUILDING PANELS TAB] Erro na remoção:', error);
      toast.error('Erro ao remover painel: ' + (error as any)?.message || 'Erro desconhecido');
    } finally {
      setRemovalState(prev => ({ ...prev, loading: false }));
    }
  }, [removalState.panel, buildingName, onRefresh]);

  const handleCloseAlert = useCallback(() => {
    setRemovalState({ isOpen: false, panel: null, loading: false });
  }, []);

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
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                size="sm"
                onClick={onAssignPanel}
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
              {panels.map((panel: any) => {
                console.log('🎯 [BUILDING PANELS TAB] Renderizando card para painel:', panel.code);
                return (
                  <PanelCard
                    key={panel.id}
                    panel={panel}
                    onRemove={handleRemoveRequest}
                    onSync={onSyncPanel}
                    onViewDetails={onViewPanelDetails}
                  />
                );
              })}
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
                className="bg-indexa-purple hover:bg-indexa-purple-dark"
              >
                <Plus className="h-4 w-4 mr-1" />
                Atribuir Primeiro Painel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AlertDialog para confirmação de remoção */}
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
