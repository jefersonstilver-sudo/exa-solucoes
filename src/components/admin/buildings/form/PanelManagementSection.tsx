
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Monitor, Plus, Trash2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import SimplePanelRemovalAlert from '../panels/SimplePanelRemovalAlert';
import PanelAssignmentDialog from '../panels/PanelAssignmentDialog';

interface PanelManagementSectionProps {
  panels: any[];
  buildingId: string;
  buildingName?: string;
  onPanelsChange: (panels: any[]) => void;
}

const PanelManagementSection: React.FC<PanelManagementSectionProps> = ({
  panels,
  buildingId,
  buildingName = '',
  onPanelsChange
}) => {
  const [removalState, setRemovalState] = useState({
    isOpen: false,
    panel: null as any,
    loading: false
  });

  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  console.log('🔧 [PANEL MANAGEMENT] Renderizando com painéis:', panels.length);

  // CORREÇÃO CRÍTICA: Função para recarregar painéis do banco
  const reloadPanelsFromDatabase = useCallback(async () => {
    if (!buildingId) {
      console.warn('⚠️ [PANEL MANAGEMENT] Building ID não disponível para reload');
      return;
    }

    try {
      setRefreshing(true);
      console.log('🔄 [PANEL MANAGEMENT] Recarregando painéis do banco para building:', buildingId);
      
      const { data, error } = await supabase
        .from('painels')
        .select('*')
        .eq('building_id', buildingId);

      if (error) {
        console.error('❌ [PANEL MANAGEMENT] Erro ao recarregar painéis:', error);
        throw error;
      }

      console.log('✅ [PANEL MANAGEMENT] Painéis recarregados do banco:', data?.length || 0);
      onPanelsChange(data || []);
      
    } catch (error) {
      console.error('💥 [PANEL MANAGEMENT] Erro crítico no reload:', error);
      toast.error('Erro ao recarregar painéis: ' + (error as any)?.message);
    } finally {
      setRefreshing(false);
    }
  }, [buildingId, onPanelsChange]);

  const handleRemoveRequest = useCallback((panel: any) => {
    console.log('🗑️ [PANEL MANAGEMENT] Solicitação de remoção:', panel.code);
    
    if (!panel?.id || !panel?.code) {
      console.error('❌ [PANEL MANAGEMENT] Panel inválido:', panel);
      toast.error('Erro: Dados do painel inválidos');
      return;
    }

    if (removalState.isOpen) {
      console.log('⚠️ [PANEL MANAGEMENT] Dialog já aberto, fechando primeiro');
      setRemovalState({ isOpen: false, panel: null, loading: false });
      
      setTimeout(() => {
        setRemovalState({
          isOpen: true,
          panel: panel,
          loading: false
        });
      }, 200);
      return;
    }

    setRemovalState({
      isOpen: true,
      panel: panel,
      loading: false
    });
  }, [removalState.isOpen]);

  const handleConfirmRemoval = useCallback(async () => {
    const { panel } = removalState;
    
    console.log('🔄 [PANEL MANAGEMENT] Confirmando remoção:', panel?.code);
    
    if (!panel?.id) {
      console.error('❌ [PANEL MANAGEMENT] Panel não encontrado');
      toast.error('Erro: Painel não encontrado');
      setRemovalState({ isOpen: false, panel: null, loading: false });
      return;
    }

    setRemovalState(prev => ({ ...prev, loading: true }));

    try {
      console.log('🔄 [PANEL MANAGEMENT] Executando UPDATE no Supabase...');
      const { error } = await supabase
        .from('painels')
        .update({ building_id: null })
        .eq('id', panel.id);

      if (error) {
        console.error('❌ [PANEL MANAGEMENT] Erro no UPDATE:', error);
        throw error;
      }

      console.log('✅ [PANEL MANAGEMENT] UPDATE executado com sucesso');
      toast.success(`Painel "${panel.code}" removido com sucesso!`);
      
      setRemovalState({ isOpen: false, panel: null, loading: false });
      
      // CORREÇÃO: Recarregar do banco ao invés de filtrar localmente
      setTimeout(() => {
        console.log('🔄 [PANEL MANAGEMENT] Recarregando após remoção...');
        reloadPanelsFromDatabase();
      }, 300);
      
    } catch (error) {
      console.error('💥 [PANEL MANAGEMENT] Erro na remoção:', error);
      toast.error('Erro ao remover painel: ' + (error as any)?.message);
      setRemovalState({ isOpen: false, panel: null, loading: false });
    }
  }, [removalState.panel, reloadPanelsFromDatabase]);

  const handleCloseAlert = useCallback((open: boolean) => {
    console.log('🔄 [PANEL MANAGEMENT] Fechando alert:', open);
    
    if (!open && !removalState.loading) {
      setRemovalState({ isOpen: false, panel: null, loading: false });
    }
  }, [removalState.loading]);

  const handleAssignPanel = useCallback(() => {
    console.log('➕ [PANEL MANAGEMENT] Abrindo dialog de atribuição');
    setAssignmentDialogOpen(true);
  }, []);

  // CORREÇÃO CRÍTICA: Callback que realmente recarrega os dados
  const handleAssignmentSuccess = useCallback(() => {
    console.log('✅ [PANEL MANAGEMENT] Atribuição realizada com sucesso - RECARREGANDO DO BANCO');
    setAssignmentDialogOpen(false);
    
    // CORREÇÃO: Recarregar do banco ao invés de limpar a lista
    setTimeout(() => {
      console.log('🔄 [PANEL MANAGEMENT] Executando reload após atribuição...');
      reloadPanelsFromDatabase();
    }, 500);
  }, [reloadPanelsFromDatabase]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Monitor className="h-5 w-5 mr-2" />
              Painéis Atribuídos ({panels.length})
            </div>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={reloadPanelsFromDatabase}
                disabled={removalState.loading || refreshing}
                className="flex items-center"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                size="sm"
                onClick={handleAssignPanel}
                disabled={removalState.loading || refreshing}
                className="bg-indexa-purple hover:bg-indexa-purple-dark"
              >
                <Plus className="h-4 w-4 mr-1" />
                Atribuir Painel
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {refreshing ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-indexa-purple mr-2" />
              <span className="text-indexa-purple">Recarregando painéis...</span>
            </div>
          ) : panels.length > 0 ? (
            <div className="space-y-3">
              {panels.map((panel: any) => (
                <div key={panel.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Monitor className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="font-medium">{panel.code}</div>
                      <div className="text-sm text-gray-500">
                        Status: 
                        <Badge 
                          variant={panel.status === 'online' ? 'default' : 'destructive'}
                          className="ml-1"
                        >
                          {panel.status || 'offline'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemoveRequest(panel)}
                    disabled={removalState.loading || refreshing}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remover
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">Nenhum painel atribuído a este prédio</p>
              <Button
                onClick={handleAssignPanel}
                disabled={removalState.loading || refreshing}
                className="bg-indexa-purple hover:bg-indexa-purple-dark"
              >
                <Plus className="h-4 w-4 mr-1" />
                Atribuir Primeiro Painel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <SimplePanelRemovalAlert
        open={removalState.isOpen}
        onOpenChange={handleCloseAlert}
        panelCode={removalState.panel?.code || ''}
        buildingName={buildingName}
        onConfirm={handleConfirmRemoval}
        loading={removalState.loading}
      />

      <PanelAssignmentDialog
        open={assignmentDialogOpen}
        onOpenChange={setAssignmentDialogOpen}
        buildingId={buildingId}
        buildingName={buildingName}
        onSuccess={handleAssignmentSuccess}
      />
    </>
  );
};

export default PanelManagementSection;
