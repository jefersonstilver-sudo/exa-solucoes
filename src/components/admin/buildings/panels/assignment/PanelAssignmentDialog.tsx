
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Monitor } from 'lucide-react';
import { useAvailablePanels } from '@/hooks/panels/useAvailablePanels';
import { usePanelAssignment } from '@/hooks/panels/usePanelAssignment';
import PanelAssignmentHeader from './PanelAssignmentHeader';
import PanelAssignmentFilters from './PanelAssignmentFilters';
import PanelAssignmentList from './PanelAssignmentList';
import PanelAssignmentFooter from './PanelAssignmentFooter';

interface PanelAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  buildingId: string;
  buildingName: string;
  onSuccess: () => void;
}

const PanelAssignmentDialog: React.FC<PanelAssignmentDialogProps> = ({
  open,
  onOpenChange,
  buildingId,
  buildingName,
  onSuccess
}) => {
  const [selectedPanels, setSelectedPanels] = useState<string[]>([]);

  const {
    panels,
    loading: loadingPanels,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    orientationFilter,
    setOrientationFilter,
    refetch,
    clearFilters
  } = useAvailablePanels({ open });

  const {
    loading: assigning,
    assignPanelsToBuilding
  } = usePanelAssignment({
    buildingId,
    buildingName,
    onSuccess: () => {
      onSuccess();
      setSelectedPanels([]);
      onOpenChange(false);
    }
  });

  console.log('🏢 [PANEL ASSIGNMENT DIALOG] Renderizando para:', {
    buildingName,
    panelsAvailable: panels.length,
    selectedCount: selectedPanels.length,
    open
  });

  const handleSelectPanel = (panelId: string) => {
    setSelectedPanels(prev =>
      prev.includes(panelId)
        ? prev.filter(id => id !== panelId)
        : [...prev, panelId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPanels.length === panels.length) {
      setSelectedPanels([]);
    } else {
      setSelectedPanels(panels.map(p => p.id));
    }
  };

  const handleAssign = async () => {
    await assignPanelsToBuilding(selectedPanels);
  };

  const handleClose = () => {
    if (!assigning) {
      setSelectedPanels([]);
      onOpenChange(false);
    }
  };

  const isOperationInProgress = loadingPanels || assigning;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Monitor className="h-6 w-6 mr-2 text-blue-500" />
            Atribuir Painéis - {buildingName}
          </DialogTitle>
          <DialogDescription>
            Selecione os painéis que deseja atribuir a este prédio
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          <PanelAssignmentHeader
            availableCount={panels.length}
            selectedCount={selectedPanels.length}
            onRefresh={refetch}
            loading={isOperationInProgress}
          />

          <PanelAssignmentFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            orientationFilter={orientationFilter}
            onOrientationFilterChange={setOrientationFilter}
            onClearFilters={clearFilters}
            disabled={isOperationInProgress}
          />

          <PanelAssignmentList
            panels={panels}
            selectedPanels={selectedPanels}
            onSelectPanel={handleSelectPanel}
            onSelectAll={handleSelectAll}
            loading={loadingPanels}
            disabled={assigning}
          />
        </div>

        <PanelAssignmentFooter
          selectedCount={selectedPanels.length}
          onAssign={handleAssign}
          onCancel={handleClose}
          loading={assigning}
          disabled={isOperationInProgress}
        />
      </DialogContent>
    </Dialog>
  );
};

export default PanelAssignmentDialog;
