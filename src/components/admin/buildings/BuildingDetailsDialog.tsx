
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
  
  // State management simplificado para dialogs
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [removalDialogOpen, setRemovalDialogOpen] = useState(false);
  const [selectedPanelForRemoval, setSelectedPanelForRemoval] = useState<any>(null);

  useEffect(() => {
    if (building && open) {
      console.log('🏢 [BUILDING DETAILS] Carregando dados do prédio:', building.nome);
      fetchBuildingData();
    }
  }, [building, open]);

  // Limpar estado quando o dialog principal fechar
  useEffect(() => {
    if (!open) {
      console.log('🔄 [BUILDING DETAILS] Dialog principal fechado, limpando estados');
      setSelectedPanelForRemoval(null);
      setRemovalDialogOpen(false);
      setAssignmentDialogOpen(false);
    }
  }, [open]);

  const fetchBuildingData = async () => {
    if (!building?.id) {
      console.error('❌ [BUILDING DETAILS] ID do prédio não encontrado');
      return;
    }
    
    setLoading(true);
    try {
      console.log('🔍 [BUILDING DETAILS] Buscando dados para prédio ID:', building.id);

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
      const { data: panelsData, error: panelsError } = await supabase
        .from('painels')
        .select('*')
        .eq('building_id', building.id)
        .order('code');

      if (panelsError) {
        console.error('❌ [BUILDING DETAILS] Erro ao buscar painéis:', panelsError);
        toast.error('Erro ao carregar painéis do prédio');
      } else {
        console.log('✅ [BUILDING DETAILS] Painéis carregados:', panelsData?.length || 0);
        setPanels(panelsData || []);
      }

    } catch (error) {
      console.error('💥 [BUILDING DETAILS] Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados do prédio');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncPanel = async (panelId: string) => {
    if (!panelId) {
      toast.error('ID do painel inválido');
      return;
    }

    try {
      console.log('🔄 [BUILDING DETAILS] Sincronizando painel:', panelId);
      
      const { error } = await supabase
        .from('painels')
        .update({ ultima_sync: new Date().toISOString() })
        .eq('id', panelId);

      if (error) throw error;

      toast.success('Painel sincronizado com sucesso!');
      fetchBuildingData();
    } catch (error) {
      console.error('❌ [BUILDING DETAILS] Erro ao sincronizar painel:', error);
      toast.error('Erro ao sincronizar painel');
    }
  };

  const handleRemovePanel = (panel: any) => {
    console.log('🗑️ [BUILDING DETAILS] Iniciando remoção de painel:', {
      panelId: panel?.id,
      panelCode: panel?.code,
      buildingName: building?.nome
    });

    // Validações robustas
    if (!panel) {
      console.error('❌ [BUILDING DETAILS] Painel não definido');
      toast.error('Erro: Painel não encontrado');
      return;
    }

    if (!panel.id) {
      console.error('❌ [BUILDING DETAILS] ID do painel inválido:', panel);
      toast.error('Erro: ID do painel inválido');
      return;
    }

    if (!building?.id) {
      console.error('❌ [BUILDING DETAILS] ID do prédio não encontrado');
      toast.error('Erro: Prédio não identificado');
      return;
    }

    // Definir estado e abrir dialog
    console.log('✅ [BUILDING DETAILS] Abrindo dialog de remoção');
    setSelectedPanelForRemoval(panel);
    setRemovalDialogOpen(true);
  };

  const handleViewPanelDetails = (panelId: string) => {
    if (!panelId) {
      toast.error('ID do painel inválido');
      return;
    }
    
    console.log('👁️ [BUILDING DETAILS] Visualizar detalhes do painel:', panelId);
    toast.info('Funcionalidade de detalhes do painel em desenvolvimento');
  };

  const handleAssignmentSuccess = () => {
    console.log('✅ [BUILDING DETAILS] Atribuição bem-sucedida, atualizando dados');
    fetchBuildingData();
    setAssignmentDialogOpen(false);
  };

  const handleRemovalSuccess = () => {
    console.log('✅ [BUILDING DETAILS] Remoção bem-sucedida, atualizando dados');
    fetchBuildingData();
    setSelectedPanelForRemoval(null);
    setRemovalDialogOpen(false);
  };

  const handleRemovalDialogClose = (open: boolean) => {
    console.log('🔄 [BUILDING DETAILS] Estado do dialog de remoção:', open);
    setRemovalDialogOpen(open);
    if (!open) {
      setSelectedPanelForRemoval(null);
    }
  };

  const handleAssignmentDialogClose = (open: boolean) => {
    console.log('🔄 [BUILDING DETAILS] Estado do dialog de atribuição:', open);
    setAssignmentDialogOpen(open);
  };

  // Validação antes de renderizar
  if (!building) {
    console.warn('⚠️ [BUILDING DETAILS] Componente renderizado sem prédio');
    return null;
  }

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

      {/* Dialog de Atribuição */}
      <PanelAssignmentDialog
        open={assignmentDialogOpen}
        onOpenChange={handleAssignmentDialogClose}
        buildingId={building?.id}
        buildingName={building?.nome}
        onSuccess={handleAssignmentSuccess}
      />

      {/* Dialog de Remoção - Renderizar apenas quando há painel selecionado */}
      {selectedPanelForRemoval && (
        <PanelRemovalDialog
          open={removalDialogOpen}
          onOpenChange={handleRemovalDialogClose}
          panel={selectedPanelForRemoval}
          buildingName={building?.nome}
          onSuccess={handleRemovalSuccess}
        />
      )}
    </>
  );
};

export default BuildingDetailsDialog;
