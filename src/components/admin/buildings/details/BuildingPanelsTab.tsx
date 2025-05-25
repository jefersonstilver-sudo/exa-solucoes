
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Monitor, RefreshCw } from 'lucide-react';
import { useSharedPanelOperations } from '@/hooks/panels/useSharedPanelOperations';
import PanelCard from '../panels/PanelCard';
import SimplePanelRemovalAlert from '../panels/SimplePanelRemovalAlert';
import PanelAssignmentDialog from '../panels/assignment/PanelAssignmentDialog';

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
  const [selectedPanel, setSelectedPanel] = useState<any>(null);
  const [showRemovalAlert, setShowRemovalAlert] = useState(false);
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);

  const { loading: removing, removePanel } = useSharedPanelOperations();

  console.log('🏢 [BUILDING PANELS TAB] Renderizando com painéis:', panels.length);

  const getPanelStatusSummary = () => {
    const summary = panels.reduce((acc, panel) => {
      acc[panel.status] = (acc[panel.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return summary;
  };

  const statusSummary = getPanelStatusSummary();

  const handleRemoveRequest = useCallback((panel: any) => {
    console.log('🗑️ [BUILDING PANELS TAB] Solicitação de remoção:', panel.code);
    
    if (!panel?.id || !panel?.code) {
      console.error('❌ [BUILDING PANELS TAB] Panel inválido:', panel);
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
        onRefresh();
      }, 300);
    }
  }, [selectedPanel, removePanel, buildingName, onRefresh]);

  const handleCloseAlert = useCallback((open: boolean) => {
    if (!open && !removing) {
      setShowRemovalAlert(false);
      setSelectedPanel(null);
    }
  }, [removing]);

  const handleAssignmentSuccess = useCallback(() => {
    console.log('✅ [BUILDING PANELS TAB] Atribuição realizada com sucesso');
    onRefresh();
  }, [onRefresh]);

  const isGlobalOperationInProgress = removing || loading;

  // Extrair buildingId do primeiro painel (assumindo que todos pertencem ao mesmo prédio)
  const buildingId = panels.length > 0 ? panels[0].building_id : '';

  return (
    <>
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
                  onClick={() => setShowAssignmentDialog(true)}
                  disabled={isGlobalOperationInProgress}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Monitor className="h-4 w-4 mr-1" />
                  Atribuir Painéis
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                  onClick={() => setShowAssignmentDialog(true)}
                  disabled={isGlobalOperationInProgress}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Monitor className="h-4 w-4 mr-1" />
                  Atribuir Painéis
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <SimplePanelRemovalAlert
        open={showRemovalAlert}
        onOpenChange={handleCloseAlert}
        panelCode={selectedPanel?.code || ''}
        buildingName={buildingName}
        onConfirm={handleConfirmRemoval}
        loading={removing}
      />

      {buildingId && (
        <PanelAssignmentDialog
          open={showAssignmentDialog}
          onOpenChange={setShowAssignmentDialog}
          buildingId={buildingId}
          buildingName={buildingName}
          onSuccess={handleAssignmentSuccess}
        />
      )}
    </>
  );
};

export default BuildingPanelsTab;
