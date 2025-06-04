
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
    panelsCount: panels?.length || 0,
    salesCount: sales?.length || 0,
    logsCount: actionLogs?.length || 0,
    loading
  });

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview">Visão Geral</TabsTrigger>
        <TabsTrigger value="panels">Painéis ({panels?.length || 0})</TabsTrigger>
        <TabsTrigger value="sales">Vendas ({sales?.length || 0})</TabsTrigger>
        <TabsTrigger value="logs">Histórico ({actionLogs?.length || 0})</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <BuildingOverviewTab building={building} panels={panels} />
      </TabsContent>

      <TabsContent value="panels" className="space-y-6">
        <AssignedPanelsTab 
          buildingId={building?.id}
          buildingName={building?.nome}
          panels={panels}
          loading={loading}
          onRefresh={onRefresh}
        />
      </TabsContent>

      <TabsContent value="sales" className="space-y-6">
        <BuildingSalesTab sales={sales} loading={loading} />
      </TabsContent>

      <TabsContent value="logs" className="space-y-6">
        <BuildingLogsTab actionLogs={actionLogs} loading={loading} />
      </TabsContent>
    </Tabs>
  );
};

export default BuildingDetailsTabsContent;
