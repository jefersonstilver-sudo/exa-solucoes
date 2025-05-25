
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BuildingOverviewTab from './BuildingOverviewTab';
import BuildingPanelsTab from './BuildingPanelsTab';
import BuildingSalesTab from './BuildingSalesTab';
import BuildingLogsTab from './BuildingLogsTab';

interface BuildingDetailsTabsContentProps {
  building: any;
  panels: any[];
  sales: any[];
  actionLogs: any[];
  loading: boolean;
  onRefresh: () => void;
  onAssignPanel: () => void;
  onSyncPanel: (panelId: string) => Promise<void>;
  onViewPanelDetails: (panelId: string) => void;
}

const BuildingDetailsTabsContent: React.FC<BuildingDetailsTabsContentProps> = ({
  building,
  panels,
  sales,
  actionLogs,
  loading,
  onRefresh,
  onAssignPanel,
  onSyncPanel,
  onViewPanelDetails
}) => {
  console.log('🏗️ [BUILDING DETAILS TABS] Renderizando tabs para:', building?.nome);

  return (
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
          onRefresh={onRefresh}
          onAssignPanel={onAssignPanel}
          onSyncPanel={onSyncPanel}
          onViewPanelDetails={onViewPanelDetails}
          buildingName={building?.nome}
        />
      </TabsContent>

      <TabsContent value="sales">
        <BuildingSalesTab sales={sales} />
      </TabsContent>

      <TabsContent value="logs">
        <BuildingLogsTab actionLogs={actionLogs} />
      </TabsContent>
    </Tabs>
  );
};

export default BuildingDetailsTabsContent;
