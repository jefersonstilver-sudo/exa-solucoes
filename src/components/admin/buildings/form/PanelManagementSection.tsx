
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Monitor, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import SimplePanelRemovalAlert from '../panels/SimplePanelRemovalAlert';

interface PanelManagementSectionProps {
  panels: any[];
  buildingId: string;
  buildingName?: string;
  onPanelsChange: (panels: any[]) => void;
  onAssignPanel: () => void;
}

const PanelManagementSection: React.FC<PanelManagementSectionProps> = ({
  panels,
  buildingId,
  buildingName = '',
  onPanelsChange,
  onAssignPanel
}) => {
  const [removalState, setRemovalState] = useState({
    isOpen: false,
    panel: null as any,
    loading: false
  });

  console.log('🔧 [PANEL MANAGEMENT] Renderizando com painéis:', panels.length);

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
      const { error } = await supabase
        .from('painels')
        .update({ building_id: null })
        .eq('id', panel.id);

      if (error) {
        throw error;
      }

      toast.success(`Painel "${panel.code}" removido com sucesso!`);
      
      const updatedPanels = panels.filter(p => p.id !== panel.id);
      onPanelsChange(updatedPanels);
      
      setRemovalState({ isOpen: false, panel: null, loading: false });
      
    } catch (error) {
      console.error('💥 [PANEL MANAGEMENT] Erro na remoção:', error);
      toast.error('Erro ao remover painel: ' + (error as any)?.message);
      setRemovalState({ isOpen: false, panel: null, loading: false });
    }
  }, [removalState.panel, panels, onPanelsChange]);

  const handleCloseAlert = useCallback((open: boolean) => {
    console.log('🔄 [PANEL MANAGEMENT] Fechando alert:', open);
    
    if (!open && !removalState.loading) {
      setRemovalState({ isOpen: false, panel: null, loading: false });
    }
  }, [removalState.loading]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Monitor className="h-5 w-5 mr-2" />
              Painéis Atribuídos ({panels.length})
            </div>
            <Button
              size="sm"
              onClick={onAssignPanel}
              disabled={removalState.loading}
              className="bg-indexa-purple hover:bg-indexa-purple-dark"
            >
              <Plus className="h-4 w-4 mr-1" />
              Atribuir Painel
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {panels.length > 0 ? (
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
                    disabled={removalState.loading}
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
                onClick={onAssignPanel}
                disabled={removalState.loading}
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
    </>
  );
};

export default PanelManagementSection;
