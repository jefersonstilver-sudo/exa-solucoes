
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Monitor, 
  Plus, 
  RefreshCw, 
  Trash2,
  Wifi,
  WifiOff,
  Settings
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import PanelAssignmentDialog from '../panels/PanelAssignmentDialog';
import PanelRemovalDialog from '../panels/PanelRemovalDialog';

interface PanelManagementSectionProps {
  buildingId?: string;
  buildingName?: string;
  onPanelsChange?: () => void;
}

const PanelManagementSection: React.FC<PanelManagementSectionProps> = ({
  buildingId,
  buildingName,
  onPanelsChange
}) => {
  const [panels, setPanels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [removalDialogOpen, setRemovalDialogOpen] = useState(false);
  const [selectedPanelForRemoval, setSelectedPanelForRemoval] = useState(null);

  useEffect(() => {
    if (buildingId) {
      fetchPanels();
    }
  }, [buildingId]);

  const fetchPanels = async () => {
    if (!buildingId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('painels')
        .select('*')
        .eq('building_id', buildingId)
        .order('code');

      if (error) throw error;
      setPanels(data || []);
    } catch (error) {
      console.error('Erro ao buscar painéis:', error);
      toast.error('Erro ao carregar painéis do prédio');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentSuccess = () => {
    fetchPanels();
    onPanelsChange?.();
  };

  const handleRemovePanel = (panel: any) => {
    setSelectedPanelForRemoval(panel);
    setRemovalDialogOpen(true);
  };

  const handleRemovalSuccess = () => {
    fetchPanels();
    onPanelsChange?.();
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'online':
        return {
          badge: 'bg-green-500 text-white',
          icon: <Wifi className="h-3 w-3" />,
          label: 'Online'
        };
      case 'offline':
        return {
          badge: 'bg-red-500 text-white',
          icon: <WifiOff className="h-3 w-3" />,
          label: 'Offline'
        };
      case 'maintenance':
        return {
          badge: 'bg-yellow-500 text-white',
          icon: <Settings className="h-3 w-3" />,
          label: 'Manutenção'
        };
      default:
        return {
          badge: 'bg-gray-500 text-white',
          icon: <Monitor className="h-3 w-3" />,
          label: 'Desconhecido'
        };
    }
  };

  if (!buildingId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Monitor className="h-5 w-5 mr-2" />
            Painéis Atribuídos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">
            Salve o prédio primeiro para gerenciar painéis
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
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
                onClick={fetchPanels}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                size="sm"
                onClick={() => setAssignmentDialogOpen(true)}
                className="bg-indexa-purple hover:bg-indexa-purple-dark"
              >
                <Plus className="h-4 w-4 mr-1" />
                Atribuir
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Carregando painéis...</span>
            </div>
          ) : panels.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {panels.map((panel) => {
                const statusConfig = getStatusConfig(panel.status);
                return (
                  <div
                    key={panel.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        {statusConfig.icon}
                        <span className="font-medium">{panel.code}</span>
                      </div>
                      <Badge className={statusConfig.badge}>
                        {statusConfig.label}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-sm text-gray-500">
                        {panel.resolucao || 'N/A'}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemovePanel(panel)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum painel atribuído
              </h3>
              <p className="text-gray-500 mb-4">
                Este prédio ainda não possui painéis atribuídos.
              </p>
              <Button
                onClick={() => setAssignmentDialogOpen(true)}
                className="bg-indexa-purple hover:bg-indexa-purple-dark"
              >
                <Plus className="h-4 w-4 mr-1" />
                Atribuir Primeiro Painel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <PanelAssignmentDialog
        open={assignmentDialogOpen}
        onOpenChange={setAssignmentDialogOpen}
        buildingId={buildingId}
        buildingName={buildingName || ''}
        onSuccess={handleAssignmentSuccess}
      />

      <PanelRemovalDialog
        open={removalDialogOpen}
        onOpenChange={setRemovalDialogOpen}
        panel={selectedPanelForRemoval}
        buildingName={buildingName || ''}
        onSuccess={handleRemovalSuccess}
      />
    </>
  );
};

export default PanelManagementSection;
