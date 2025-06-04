
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Monitor, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAssignedPanels } from '@/hooks/useAssignedPanels';
import PanelDetailsDialog from '@/components/admin/panels/PanelDetailsDialog';
import AssignedPanelsEmptyState from './AssignedPanelsEmptyState';
import AssignedPanelsGrid from './AssignedPanelsGrid';

interface AssignedPanelsTabProps {
  buildingId?: string;
  buildingName?: string;
  panels?: any[];
  loading?: boolean;
  onRefresh?: () => void;
}

const AssignedPanelsTab: React.FC<AssignedPanelsTabProps> = ({ 
  buildingId, 
  buildingName,
  panels = [],
  loading = false,
  onRefresh
}) => {
  const {
    selectedPanel,
    isPanelDetailsOpen,
    setIsPanelDetailsOpen,
    unassigningPanelId,
    handleViewPanelDetails,
    handleUnassignPanel
  } = useAssignedPanels({ buildingId, onRefresh });

  console.log('🔍 [ASSIGNED PANELS] Renderizando aba com:', {
    buildingId,
    buildingName,
    panelsCount: panels?.length || 0,
    loading
  });

  if (!buildingId) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">Prédio não identificado.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Monitor className="h-5 w-5 mr-2" />
                Painéis Atribuídos ao {buildingName}
              </CardTitle>
              {onRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  disabled={loading}
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Atualizar</span>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-indexa-purple mr-2" />
                <span className="text-gray-600">Carregando painéis atribuídos...</span>
              </div>
            ) : panels.length === 0 ? (
              <AssignedPanelsEmptyState />
            ) : (
              <AssignedPanelsGrid
                panels={panels}
                unassigningPanelId={unassigningPanelId}
                onViewDetails={handleViewPanelDetails}
                onUnassign={handleUnassignPanel}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <PanelDetailsDialog
        open={isPanelDetailsOpen}
        onOpenChange={setIsPanelDetailsOpen}
        panel={selectedPanel}
      />
    </>
  );
};

export default AssignedPanelsTab;
