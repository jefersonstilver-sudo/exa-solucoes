
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import PanelAssignmentDialog from './panels/PanelAssignmentDialog';
import PanelRemovalDialog from './panels/PanelRemovalDialog';
import BuildingOverviewTab from './details/BuildingOverviewTab';
import BuildingPanelsTab from './details/BuildingPanelsTab';
import BuildingSalesTab from './details/BuildingSalesTab';
import BuildingLogsTab from './details/BuildingLogsTab';

interface BuildingDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  building?: any;
}

const BuildingDetailsDialog: React.FC<BuildingDetailsDialogProps> = ({
  open,
  onOpenChange,
  building
}) => {
  const [actionLogs, setActionLogs] = useState([]);
  const [sales, setSales] = useState([]);
  const [panels, setPanels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [removalDialogOpen, setRemovalDialogOpen] = useState(false);
  const [selectedPanelForRemoval, setSelectedPanelForRemoval] = useState(null);

  useEffect(() => {
    if (building && open) {
      fetchBuildingData();
    }
  }, [building, open]);

  const fetchBuildingData = async () => {
    if (!building) return;
    
    setLoading(true);
    try {
      // Buscar logs de ações
      const { data: logsData } = await supabase
        .from('building_action_logs')
        .select(`
          *,
          users:user_id (email)
        `)
        .eq('building_id', building.id)
        .order('created_at', { ascending: false })
        .limit(20);

      setActionLogs(logsData || []);

      // Buscar vendas/pedidos relacionados ao prédio
      const { data: salesData } = await supabase
        .from('pedidos')
        .select('*')
        .contains('lista_paineis', [building.id])
        .order('created_at', { ascending: false });

      setSales(salesData || []);

      // Buscar painéis do prédio
      const { data: panelsData } = await supabase
        .from('painels')
        .select('*')
        .eq('building_id', building.id)
        .order('code');

      setPanels(panelsData || []);

    } catch (error) {
      console.error('Erro ao carregar dados do prédio:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncPanel = async (panelId: string) => {
    try {
      // Simular sincronização do painel
      const { error } = await supabase
        .from('painels')
        .update({ ultima_sync: new Date().toISOString() })
        .eq('id', panelId);

      if (error) throw error;

      toast.success('Painel sincronizado com sucesso!');
      fetchBuildingData(); // Recarregar dados
    } catch (error) {
      console.error('Erro ao sincronizar painel:', error);
      toast.error('Erro ao sincronizar painel');
    }
  };

  const handleRemovePanel = (panel: any) => {
    setSelectedPanelForRemoval(panel);
    setRemovalDialogOpen(true);
  };

  const handleViewPanelDetails = (panelId: string) => {
    // Implementar visualização de detalhes do painel
    toast.info('Funcionalidade de detalhes do painel em desenvolvimento');
  };

  if (!building) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Building2 className="h-6 w-6 mr-2 text-indexa-purple" />
              {building.nome}
            </DialogTitle>
            <DialogDescription>
              Informações detalhadas e histórico completo do prédio
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="panels">
                Painéis ({panels.length})
              </TabsTrigger>
              <TabsTrigger value="sales">Vendas</TabsTrigger>
              <TabsTrigger value="logs">Histórico</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <BuildingOverviewTab building={building} panels={panels} />
            </TabsContent>

            <TabsContent value="panels" className="space-y-6">
              <BuildingPanelsTab
                panels={panels}
                loading={loading}
                onRefresh={fetchBuildingData}
                onAssignPanel={() => setAssignmentDialogOpen(true)}
                onRemovePanel={handleRemovePanel}
                onSyncPanel={handleSyncPanel}
                onViewPanelDetails={handleViewPanelDetails}
              />
            </TabsContent>

            <TabsContent value="sales">
              <BuildingSalesTab sales={sales} />
            </TabsContent>

            <TabsContent value="logs">
              <BuildingLogsTab actionLogs={actionLogs} />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <PanelAssignmentDialog
        open={assignmentDialogOpen}
        onOpenChange={setAssignmentDialogOpen}
        buildingId={building?.id}
        buildingName={building?.nome}
        onSuccess={fetchBuildingData}
      />

      <PanelRemovalDialog
        open={removalDialogOpen}
        onOpenChange={setRemovalDialogOpen}
        panel={selectedPanelForRemoval}
        buildingName={building?.nome}
        onSuccess={fetchBuildingData}
      />
    </>
  );
};

export default BuildingDetailsDialog;
