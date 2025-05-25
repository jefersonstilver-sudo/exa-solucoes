
import React, { useState, useEffect } from 'react';
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

  console.log('🏢 [PANEL ASSIGNMENT DIALOG] Renderizando:', {
    open,
    buildingId,
    buildingName,
    selectedPanelsCount: selectedPanels.length,
    timestamp: new Date().toISOString()
  });

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
      console.log('✅ [PANEL ASSIGNMENT DIALOG] Atribuição concluída com sucesso');
      onSuccess();
      setSelectedPanels([]);
      
      // Aguardar um pouco antes de fechar para garantir que o usuário veja a mensagem de sucesso
      setTimeout(() => {
        console.log('🚪 [PANEL ASSIGNMENT DIALOG] Fechando dialog após sucesso');
        onOpenChange(false);
      }, 1000);
    }
  });

  // Debug: Log quando o estado muda
  useEffect(() => {
    console.log('📊 [PANEL ASSIGNMENT DIALOG] Estado atualizado:', {
      open,
      panelsAvailable: panels.length,
      selectedCount: selectedPanels.length,
      loadingPanels,
      assigning,
      buildingId,
      buildingName
    });
  }, [open, panels.length, selectedPanels.length, loadingPanels, assigning, buildingId, buildingName]);

  // Reset selected panels when dialog opens/closes
  useEffect(() => {
    if (!open) {
      console.log('🧹 [PANEL ASSIGNMENT DIALOG] Dialog fechado, limpando seleções');
      setSelectedPanels([]);
    }
  }, [open]);

  const handleSelectPanel = (panelId: string) => {
    console.log('🎯 [PANEL ASSIGNMENT DIALOG] Selecionando/deselecionando painel:', panelId);
    setSelectedPanels(prev => {
      const newSelection = prev.includes(panelId)
        ? prev.filter(id => id !== panelId)
        : [...prev, panelId];
      
      console.log('📋 [PANEL ASSIGNMENT DIALOG] Nova seleção:', {
        previous: prev,
        new: newSelection,
        action: prev.includes(panelId) ? 'removed' : 'added',
        panelId
      });
      
      return newSelection;
    });
  };

  const handleSelectAll = () => {
    console.log('🎯 [PANEL ASSIGNMENT DIALOG] Selecionando/deselecionando todos');
    const allSelected = selectedPanels.length === panels.length;
    const newSelection = allSelected ? [] : panels.map(p => p.id);
    
    console.log('📋 [PANEL ASSIGNMENT DIALOG] Seleção de todos:', {
      wasAllSelected: allSelected,
      newSelection: newSelection.length,
      totalPanels: panels.length
    });
    
    setSelectedPanels(newSelection);
  };

  const handleAssign = async () => {
    console.log('🚀 [PANEL ASSIGNMENT DIALOG] Iniciando atribuição:', {
      selectedPanels,
      buildingId,
      buildingName
    });
    
    if (selectedPanels.length === 0) {
      console.warn('⚠️ [PANEL ASSIGNMENT DIALOG] Nenhum painel selecionado');
      return;
    }

    try {
      const success = await assignPanelsToBuilding(selectedPanels);
      console.log('📊 [PANEL ASSIGNMENT DIALOG] Resultado da atribuição:', success);
    } catch (error) {
      console.error('💥 [PANEL ASSIGNMENT DIALOG] Erro na atribuição:', error);
    }
  };

  const handleClose = () => {
    if (!assigning) {
      console.log('🚪 [PANEL ASSIGNMENT DIALOG] Fechando dialog (usuário)');
      setSelectedPanels([]);
      onOpenChange(false);
    } else {
      console.log('⏳ [PANEL ASSIGNMENT DIALOG] Não é possível fechar - operação em andamento');
    }
  };

  const isOperationInProgress = loadingPanels || assigning;

  console.log('🎭 [PANEL ASSIGNMENT DIALOG] Estado final antes do render:', {
    isOperationInProgress,
    selectedPanels: selectedPanels.length,
    totalPanels: panels.length
  });

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
