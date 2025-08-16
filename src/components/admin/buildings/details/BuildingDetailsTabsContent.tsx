
import React, { useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BuildingOverviewTab from './BuildingOverviewTab';
import BuildingSalesTab from './BuildingSalesTab';
import BuildingLogsTab from './BuildingLogsTab';
import AssignedPanelsTab from './AssignedPanelsTab';
import AvailablePanelsTab from './AvailablePanelsTab';
import BuildingActiveCampaignsTab from './BuildingActiveCampaignsTab';
import BuildingLocationTab from './BuildingLocationTab';

interface BuildingDetailsTabsContentProps {
  building: any;
  sales: any[];
  actionLogs: any[];
  panels: any[];
  contactInfo?: any;
  canAccessContacts?: boolean;
  loading: boolean;
  onRefresh: () => void;
}

const BuildingDetailsTabsContent: React.FC<BuildingDetailsTabsContentProps> = ({
  building,
  sales,
  actionLogs,
  panels,
  contactInfo,
  canAccessContacts,
  loading,
  onRefresh
}) => {
  console.log('🏗️ [BUILDING DETAILS TABS] Renderizando tabs para:', building?.nome, {
    panelsCount: panels?.length || 0,
    salesCount: sales?.length || 0,
    logsCount: actionLogs?.length || 0,
    loading
  });

  // Callback to handle panel assignment/unassignment synchronization
  const handlePanelChange = useCallback(() => {
    console.log('🔄 [BUILDING DETAILS TABS] Sincronizando dados após alteração de painéis');
    onRefresh();
  }, [onRefresh]);

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-7">
        <TabsTrigger value="overview">Visão Geral</TabsTrigger>
        <TabsTrigger value="location">Localização</TabsTrigger>
        <TabsTrigger value="campaigns">Programação</TabsTrigger>
        <TabsTrigger value="panels">Painéis ({panels?.length || 0})</TabsTrigger>
        <TabsTrigger value="available">Disponíveis</TabsTrigger>
        <TabsTrigger value="sales">Vendas ({sales?.length || 0})</TabsTrigger>
        <TabsTrigger value="logs">Histórico ({actionLogs?.length || 0})</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <BuildingOverviewTab 
          building={building} 
          panels={panels}
          contactInfo={contactInfo}
          canAccessContacts={canAccessContacts}
        />
      </TabsContent>

      <TabsContent value="location" className="space-y-6">
        <BuildingLocationTab 
          building={building}
          onRefresh={onRefresh}
        />
      </TabsContent>

      <TabsContent value="campaigns" className="space-y-6">
        <BuildingActiveCampaignsTab 
          buildingId={building?.id}
          buildingName={building?.nome}
        />
      </TabsContent>

      <TabsContent value="panels" className="space-y-6">
        <AssignedPanelsTab 
          buildingId={building?.id}
          buildingName={building?.nome}
          panels={panels}
          loading={loading}
          onRefresh={handlePanelChange}
        />
      </TabsContent>

      <TabsContent value="available" className="space-y-6">
        <AvailablePanelsTab
          buildingId={building?.id}
          buildingName={building?.nome}
          open={true}
          onPanelAssigned={handlePanelChange}
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
