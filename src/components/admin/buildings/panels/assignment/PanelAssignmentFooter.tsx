
import React from 'react';
import { DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Monitor } from 'lucide-react';

interface PanelAssignmentFooterProps {
  selectedPanelsCount: number;
  loading: boolean;
  fetchLoading: boolean;
  onCancel: () => void;
  onAssign: () => void;
}

const PanelAssignmentFooter: React.FC<PanelAssignmentFooterProps> = ({
  selectedPanelsCount,
  loading,
  fetchLoading,
  onCancel,
  onAssign
}) => {
  return (
    <DialogFooter>
      <div className="flex items-center justify-between w-full">
        <div className="text-sm text-gray-600">
          {selectedPanelsCount} painel(s) selecionado(s)
        </div>
        <div className="flex space-x-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={onAssign}
            disabled={loading || selectedPanelsCount === 0 || fetchLoading}
            className="bg-indexa-purple hover:bg-indexa-purple-dark"
          >
            {loading ? (
              <>
                <Monitor className="h-4 w-4 mr-2 animate-spin" />
                Atribuindo...
              </>
            ) : (
              `Atribuir ${selectedPanelsCount} Painel(s)`
            )}
          </Button>
        </div>
      </div>
    </DialogFooter>
  );
};

export default PanelAssignmentFooter;
