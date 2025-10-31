
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
    contactInfo,
    canAccessContacts,
    loading,
    fetchBuildingData
  } = useBuildingDetailsData({ building, open });

  console.log('🏗️ [BUILDING DETAILS] Dialog renderizado para:', building?.nome, {
    open,
    loading,
    panelsCount: panels?.length || 0
  });

  const handleRefresh = () => {
    console.log('🔄 [BUILDING DETAILS] Atualizando todos os dados do prédio');
    fetchBuildingData();
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
            <Building2 className="h-6 w-6 mr-2 text-[#9C1E1E]" />
            {building.nome}
          </DialogTitle>
          <DialogDescription>
            Informações detalhadas e histórico completo do prédio
          </DialogDescription>
        </DialogHeader>

        <BuildingDetailsTabsContent
          building={building}
          sales={sales}
          actionLogs={actionLogs}
          panels={panels}
          contactInfo={contactInfo}
          canAccessContacts={canAccessContacts}
          loading={loading}
          onRefresh={handleRefresh}
        />
      </DialogContent>
    </Dialog>
  );
};

export default BuildingDetailsDialog;
