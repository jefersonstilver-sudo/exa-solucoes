
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
import BuildingAssignmentDialogWrapper from './details/BuildingAssignmentDialogWrapper';

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
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);

  const {
    actionLogs,
    sales,
    panels,
    loading,
    fetchBuildingData,
    handleSyncPanel,
    handleViewPanelDetails
  } = useBuildingDetailsData({ building, open });

  // Limpar estado quando o dialog principal fechar
  useEffect(() => {
    if (!open) {
      console.log('🔄 [BUILDING DETAILS] Dialog principal fechado, limpando estados');
      setAssignmentDialogOpen(false);
    }
  }, [open]);

  // Simplified remove panel handler (not used anymore, handled by BuildingPanelsTab)
  const handleRemovePanel = (panel: any) => {
    console.log('🗑️ [BUILDING DETAILS] Remoção delegada para BuildingPanelsTab:', panel?.code);
    // This is now handled by BuildingPanelsTab directly
  };

  const handleAssignmentSuccess = () => {
    console.log('✅ [BUILDING DETAILS] Atribuição bem-sucedida, atualizando dados');
    fetchBuildingData();
    setAssignmentDialogOpen(false);
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

          <BuildingDetailsTabsContent
            building={building}
            panels={panels}
            sales={sales}
            actionLogs={actionLogs}
            loading={loading}
            onRefresh={fetchBuildingData}
            onAssignPanel={() => setAssignmentDialogOpen(true)}
            onRemovePanel={handleRemovePanel}
            onSyncPanel={handleSyncPanel}
            onViewPanelDetails={handleViewPanelDetails}
          />
        </DialogContent>
      </Dialog>

      <BuildingAssignmentDialogWrapper
        open={assignmentDialogOpen}
        onOpenChange={handleAssignmentDialogClose}
        building={building}
        onSuccess={handleAssignmentSuccess}
      />
    </>
  );
};

export default BuildingDetailsDialog;
