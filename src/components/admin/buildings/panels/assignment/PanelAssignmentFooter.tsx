
import React from 'react';
import { Button } from '@/components/ui/button';
import { Monitor, Loader2 } from 'lucide-react';

interface PanelAssignmentFooterProps {
  selectedCount: number;
  onAssign: () => void;
  onCancel: () => void;
  loading: boolean;
  disabled: boolean;
}

const PanelAssignmentFooter: React.FC<PanelAssignmentFooterProps> = ({
  selectedCount,
  onAssign,
  onCancel,
  loading,
  disabled
}) => {
  return (
    <div className="flex items-center justify-between p-4 border-t bg-gray-50">
      <div className="text-sm text-gray-600">
        {selectedCount > 0 ? (
          <span className="font-medium text-blue-600">
            {selectedCount} painel{selectedCount !== 1 ? 'éis' : ''} selecionado{selectedCount !== 1 ? 's' : ''}
          </span>
        ) : (
          <span>Nenhum painel selecionado</span>
        )}
      </div>

      <div className="flex space-x-3">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </Button>
        
        <Button
          onClick={onAssign}
          disabled={selectedCount === 0 || disabled}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Atribuindo...
            </>
          ) : (
            <>
              <Monitor className="h-4 w-4 mr-2" />
              Atribuir {selectedCount > 0 ? `(${selectedCount})` : ''}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default PanelAssignmentFooter;
