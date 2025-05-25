
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MonitorPlay,
  Wifi,
  WifiOff,
  Settings,
  Plus
} from 'lucide-react';
import PanelConfigCard from './PanelConfigCard';

interface PanelsDisplayProps {
  filteredPanels: any[];
  viewMode: 'grid' | 'list';
  searchTerm: string;
  statusFilter: string;
  osFilter: string;
  orientationFilter: string;
  onViewPanel: (panel: any) => void;
  onEditPanel: (panel: any) => void;
  onDeletePanel: (panel: any) => void;
  onNewPanel: () => void;
}

const PanelsDisplay: React.FC<PanelsDisplayProps> = ({
  filteredPanels,
  viewMode,
  searchTerm,
  statusFilter,
  osFilter,
  orientationFilter,
  onViewPanel,
  onEditPanel,
  onDeletePanel,
  onNewPanel
}) => {
  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { variant: any, label: string, icon: any, color: string }> = {
      online: { variant: 'success', label: 'Online', icon: Wifi, color: 'text-green-600' },
      offline: { variant: 'destructive', label: 'Offline', icon: WifiOff, color: 'text-red-600' },
      maintenance: { variant: 'secondary', label: 'Manutenção', icon: Settings, color: 'text-orange-500' }
    };
    return statusMap[status] || statusMap.offline;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-gray-900">Painéis</CardTitle>
        <CardDescription className="text-gray-600">
          {filteredPanels.length} painéis encontrados
        </CardDescription>
      </CardHeader>
      <CardContent>
        {filteredPanels.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <MonitorPlay className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum painel encontrado
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || statusFilter !== 'all' || osFilter !== 'all' || orientationFilter !== 'all'
                ? 'Tente ajustar os filtros de busca'
                : 'Comece criando seu primeiro painel'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && osFilter === 'all' && orientationFilter === 'all' && (
              <Button onClick={onNewPanel} className="bg-indexa-purple hover:bg-indexa-purple-dark">
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Painel
              </Button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredPanels.map((panel) => (
              <PanelConfigCard
                key={panel.id}
                panel={panel}
                onView={onViewPanel}
                onEdit={onEditPanel}
                onDelete={onDeletePanel}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPanels.map((panel) => {
              const statusInfo = getStatusInfo(panel.status);
              const StatusIcon = statusInfo.icon;
              
              return (
                <div key={panel.id} className="flex items-center justify-between p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-indexa-purple/10 rounded-lg flex items-center justify-center">
                      <MonitorPlay className="h-6 w-6 text-indexa-purple" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium text-gray-900">{panel.code}</h3>
                        <Badge variant={statusInfo.variant} className="text-xs flex items-center gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-6 mt-2">
                        {panel.polegada && (
                          <p className="text-sm text-gray-500">Tamanho: {panel.polegada}"</p>
                        )}
                        {panel.resolucao && (
                          <p className="text-sm text-gray-500">Resolução: {panel.resolucao}</p>
                        )}
                        {panel.sistema_operacional && (
                          <p className="text-sm text-gray-500">SO: {panel.sistema_operacional}</p>
                        )}
                      </div>
                      {panel.buildings?.nome && (
                        <p className="text-sm text-gray-400 mt-1">
                          📍 {panel.buildings.nome}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewPanel(panel)}
                    >
                      Ver
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEditPanel(panel)}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDeletePanel(panel)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PanelsDisplay;
