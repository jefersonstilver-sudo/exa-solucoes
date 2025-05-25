
import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, RefreshCw, Trash2 } from 'lucide-react';

interface PanelCardActionsProps {
  onViewDetails: () => void;
  onSync: () => void;
  onRemove: () => void;
  isActionDisabled: boolean;
  canManage: boolean;
}

const PanelCardActions: React.FC<PanelCardActionsProps> = ({
  onViewDetails,
  onSync,
  onRemove,
  isActionDisabled,
  canManage
}) => {
  if (!canManage) {
    return null;
  }

  return (
    <div className="flex space-x-2 pt-2">
      <Button
        size="sm"
        variant="outline"
        onClick={onViewDetails}
        disabled={isActionDisabled}
        className="flex-1 bg-white/80 hover:bg-white"
      >
        <Eye className="h-3 w-3 mr-1" />
        Detalhes
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={onSync}
        disabled={isActionDisabled}
        className="bg-blue-500 text-white hover:bg-blue-600 border-blue-500"
      >
        <RefreshCw className="h-3 w-3" />
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={onRemove}
        disabled={isActionDisabled}
        className="bg-red-500 text-white hover:bg-red-600 border-red-500"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
};

export default PanelCardActions;
