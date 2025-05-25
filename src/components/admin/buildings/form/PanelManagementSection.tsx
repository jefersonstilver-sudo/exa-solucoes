
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Monitor, RefreshCw, Trash2 } from 'lucide-react';
import { useSharedPanelOperations } from '@/hooks/panels/useSharedPanelOperations';
import SimplePanelRemovalAlert from '../panels/SimplePanelRemovalAlert';
import PanelAssignmentDialog from '../panels/assignment/PanelAssignmentDialog';

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
  const [selectedPanel, setSelectedPanel] = useState<any>(null);
  const [showRemovalAlert, setShowRemovalAlert] = useState(false);
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { loading, removePanel } = useSharedPanelOperations();

  console.log('🔧 [PANEL MANAGEMENT] Renderizando com painéis:', panels.length);

  const handleRefresh = useCallback(async () => {
    if (!buildingId) return;

    try {
      setRefreshing(true);
      console.log('🔄 [PANEL MANAGEMENT] Recarregando painéis...');
      
      // Simular reload - será implementado no futuro
      setTimeout(() => {
        setRefreshing(false);
        console.log('✅ [PANEL MANAGEMENT] Refresh concluído');
      }, 1000);
      
    } catch (error) {
      console.error('💥 [PANEL MANAGEMENT] Erro no refresh:', error);
      setRefreshing(false);
    }
  }, [buildingId]);

  const handleRemoveRequest = useCallback((panel: any) => {
    console.log('🗑️ [PANEL MANAGEMENT] Solicitação de remoção:', panel.code);
    
    if (!panel?.id || !panel?.code) {
      console.error('❌ [PANEL MANAGEMENT] Panel inválido:', panel);
      return;
    }

    setSelectedPanel(panel);
    setShowRemovalAlert(true);
  }, []);

  const handleConfirmRemoval = useCallback(async () => {
    if (!selectedPanel) return;

    const success = await removePanel(selectedPanel.id, selectedPanel.code, buildingName);
    
    if (success) {
      setShowRemovalAlert(false);
      setSelectedPanel(null);
      
      setTimeout(() => {
        handleRefresh();
      }, 300);
    }
  }, [selectedPanel, removePanel, buildingName, handleRefresh]);

  const handleCloseAlert = useCallback((open: boolean) => {
    if (!open && !loading) {
      setShowRemovalAlert(false);
      setSelectedPanel(null);
    }
  }, [loading]);

  const handleAssignmentSuccess = useCallback(() => {
    console.log('✅ [PANEL MANAGEMENT] Atribuição realizada com sucesso');
    handleRefresh();
  }, [handleRefresh]);

  const isDisabled = loading || refreshing;

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
                onClick={handleRefresh}
                disabled={isDisabled}
                className="flex items-center"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                size="sm"
                onClick={() => setShowAssignmentDialog(true)}
                disabled={isDisabled}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Monitor className="h-4 w-4 mr-1" />
                Atribuir Painéis
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {refreshing ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-500 mr-2" />
              <span className="text-blue-500">Recarregando painéis...</span>
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
                    disabled={isDisabled}
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
                onClick={() => setShowAssignmentDialog(true)}
                disabled={isDisabled}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Monitor className="h-4 w-4 mr-1" />
                Atribuir Painéis
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <SimplePanelRemovalAlert
        open={showRemovalAlert}
        onOpenChange={handleCloseAlert}
        panelCode={selectedPanel?.code || ''}
        buildingName={buildingName}
        onConfirm={handleConfirmRemoval}
        loading={loading}
      />

      <PanelAssignmentDialog
        open={showAssignmentDialog}
        onOpenChange={setShowAssignmentDialog}
        buildingId={buildingId}
        buildingName={buildingName}
        onSuccess={handleAssignmentSuccess}
      />
    </>
  );
};

export default PanelManagementSection;
