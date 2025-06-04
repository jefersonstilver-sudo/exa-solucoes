
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BuildingOverviewTab from './BuildingOverviewTab';
import BuildingSalesTab from './BuildingSalesTab';
import BuildingLogsTab from './BuildingLogsTab';
import AssignedPanelsTab from './AssignedPanelsTab';

interface BuildingDetailsTabsContentProps {
  building: any;
  sales: any[];
  actionLogs: any[];
  panels: any[];
  loading: boolean;
  onRefresh: () => void;
}

const BuildingDetailsTabsContent: React.FC<BuildingDetailsTabsContentProps> = ({
  building,
  sales,
  actionLogs,
  panels,
  loading,
  onRefresh
}) => {
  console.log('🏗️ [BUILDING DETAILS TABS] Renderizando tabs para:', building?.nome, {
    panelsCount: panels?.length || 0
  });

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview">Visão Geral</TabsTrigger>
        <TabsTrigger value="panels">Painéis ({panels?.length || 0})</TabsTrigger>
        <TabsTrigger value="sales">Vendas</TabsTrigger>
        <TabsTrigger value="logs">Histórico</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <BuildingOverviewTab building={building} panels={panels} />
      </TabsContent>

      <TabsContent value="panels">
        <AssignedPanelsTab 
          buildingId={building?.id}
          buildingName={building?.nome}
          panels={panels}
          loading={loading}
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
