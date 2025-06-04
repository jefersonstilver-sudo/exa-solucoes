
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
  loading: boolean;
  onRefresh: () => void;
}

const BuildingDetailsTabsContent: React.FC<BuildingDetailsTabsContentProps> = ({
  building,
  sales,
  actionLogs,
  loading,
  onRefresh
}) => {
  console.log('🏗️ [BUILDING DETAILS TABS] Renderizando tabs para:', building?.nome);

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview">Visão Geral</TabsTrigger>
        <TabsTrigger value="panels">Painéis</TabsTrigger>
        <TabsTrigger value="sales">Vendas</TabsTrigger>
        <TabsTrigger value="logs">Histórico</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <BuildingOverviewTab building={building} panels={[]} />
      </TabsContent>

      <TabsContent value="panels">
        <AssignedPanelsTab 
          buildingId={building?.id}
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
