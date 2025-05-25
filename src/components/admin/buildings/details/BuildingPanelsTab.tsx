
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Monitor, Plus, RefreshCw } from 'lucide-react';
import PanelCard from '../panels/PanelCard';

interface BuildingPanelsTabProps {
  panels: any[];
  loading: boolean;
  onRefresh: () => void;
  onAssignPanel: () => void;
  onRemovePanel: (panel: any) => void;
  onSyncPanel: (panelId: string) => void;
  onViewPanelDetails: (panelId: string) => void;
}

const BuildingPanelsTab: React.FC<BuildingPanelsTabProps> = ({
  panels,
  loading,
  onRefresh,
  onAssignPanel,
  onRemovePanel,
  onSyncPanel,
  onViewPanelDetails
}) => {
  const getPanelStatusSummary = () => {
    const summary = panels.reduce((acc, panel) => {
      acc[panel.status] = (acc[panel.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return summary;
  };

  const statusSummary = getPanelStatusSummary();

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
              {panels.map((panel: any) => (
                <PanelCard
                  key={panel.id}
                  panel={panel}
                  onRemove={() => onRemovePanel(panel)}
                  onSync={onSyncPanel}
                  onViewDetails={onViewPanelDetails}
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
                className="bg-indexa-purple hover:bg-indexa-purple-dark"
              >
                <Plus className="h-4 w-4 mr-1" />
                Atribuir Primeiro Painel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BuildingPanelsTab;
