
import React from 'react';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Plus, CheckCircle } from 'lucide-react';

interface PanelAssignmentHeaderProps {
  buildingName: string;
  selectedPanelsCount: number;
}

const PanelAssignmentHeader: React.FC<PanelAssignmentHeaderProps> = ({
  buildingName,
  selectedPanelsCount
}) => {
  return (
    <DialogHeader>
      <DialogTitle className="flex items-center">
        <Plus className="h-5 w-5 mr-2 text-indexa-purple" />
        Atribuir Painéis ao Prédio
      </DialogTitle>
      <DialogDescription>
        Selecione os painéis que deseja atribuir ao prédio "{buildingName}"
        {selectedPanelsCount > 0 && (
          <div className="mt-2 p-2 bg-green-50 rounded-md flex items-center">
            <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
            <span className="text-green-700 font-medium">
              {selectedPanelsCount} painel(s) selecionado(s)
            </span>
          </div>
        )}
      </DialogDescription>
    </DialogHeader>
  );
};

export default PanelAssignmentHeader;
