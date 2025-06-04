
import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Monitor, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAvailablePanels } from '@/hooks/useAvailablePanels';
import AvailablePanelCard from './AvailablePanelCard';

interface AvailablePanelsTabProps {
  buildingId?: string;
  buildingName?: string;
  open: boolean;
  onPanelAssigned?: () => void;
}

const AvailablePanelsTab: React.FC<AvailablePanelsTabProps> = memo(({ 
  buildingId, 
  buildingName,
  open,
  onPanelAssigned 
}) => {
  console.log('🔍 [AVAILABLE PANELS TAB] Renderizando aba:', {
    buildingId,
    buildingName,
    open
  });

  const {
    availablePanels,
    loading,
    assigningPanelId,
    assignPanel,
    fetchAvailablePanels
  } = useAvailablePanels({ buildingId, open, onPanelAssigned });

  const handleAssignPanel = async (panelId: string, panelCode: string) => {
    await assignPanel(panelId, panelCode);
  };

  const handleRefresh = () => {
    console.log('🔄 [AVAILABLE PANELS TAB] Atualizando lista manualmente');
    fetchAvailablePanels();
  };

  if (!buildingId) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">Salve o prédio primeiro para gerenciar painéis.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Monitor className="h-5 w-5 mr-2" />
              Painéis Disponíveis para {buildingName}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-indexa-purple mr-2" />
              <span className="text-gray-600">Carregando painéis disponíveis...</span>
            </div>
          ) : availablePanels.length === 0 ? (
            <div className="text-center py-8">
              <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum painel disponível
              </h3>
              <p className="text-gray-500">
                Todos os painéis já foram atribuídos ou não há painéis cadastrados.
              </p>
            </div>
          ) : (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Encontrados <span className="font-semibold">{availablePanels.length}</span> painéis disponíveis
                </p>
                <p className="text-xs text-gray-500">
                  Passe o mouse sobre um painel para ver mais detalhes
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availablePanels.map((panel) => (
                  <AvailablePanelCard
                    key={panel.id}
                    panel={panel}
                    onAssign={handleAssignPanel}
                    isAssigning={assigningPanelId === panel.id}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

AvailablePanelsTab.displayName = 'AvailablePanelsTab';

export default AvailablePanelsTab;
