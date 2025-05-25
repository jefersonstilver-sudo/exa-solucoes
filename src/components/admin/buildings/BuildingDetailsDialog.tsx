
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Building2 } from 'lucide-react';
import { useBuildingDetailsData } from '@/hooks/useBuildingDetailsData';
import BuildingDetailsTabsContent from './details/BuildingDetailsTabsContent';

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
  const {
    actionLogs,
    sales,
    panels,
    loading,
    fetchBuildingData,
    handleSyncPanel,
    handleViewPanelDetails
  } = useBuildingDetailsData({ building, open });

  console.log('🏗️ [BUILDING DETAILS] Dialog renderizado para:', building?.nome, {
    open,
    panelsCount: panels.length,
    loading
  });

  const handleAssignmentPlaceholder = () => {
    console.log('🚧 [BUILDING DETAILS] Funcionalidade de atribuição em reconstrução');
  };

  if (!building) {
    console.warn('⚠️ [BUILDING DETAILS] Componente renderizado sem prédio');
    return null;
  }

  return (
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

        <BuildingDetailsTabsContent
          building={building}
          panels={panels}
          sales={sales}
          actionLogs={actionLogs}
          loading={loading}
          onRefresh={fetchBuildingData}
          onAssignPanel={handleAssignmentPlaceholder}
          onSyncPanel={handleSyncPanel}
          onViewPanelDetails={handleViewPanelDetails}
        />
      </DialogContent>
    </Dialog>
  );
};

export default BuildingDetailsDialog;
