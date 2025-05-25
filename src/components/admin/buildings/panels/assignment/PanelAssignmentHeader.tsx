
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Monitor } from 'lucide-react';

interface PanelAssignmentHeaderProps {
  availableCount: number;
  selectedCount: number;
  onRefresh: () => void;
  loading: boolean;
}

const PanelAssignmentHeader: React.FC<PanelAssignmentHeaderProps> = ({
  availableCount,
  selectedCount,
  onRefresh,
  loading
}) => {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Monitor className="h-5 w-5 text-gray-500" />
          <span className="text-sm font-medium">
            Painéis Disponíveis: 
            <Badge variant="outline" className="ml-2">
              {availableCount}
            </Badge>
          </span>
        </div>
        
        {selectedCount > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-blue-600 font-medium">
              Selecionados: 
              <Badge variant="default" className="ml-2 bg-blue-500">
                {selectedCount}
              </Badge>
            </span>
          </div>
        )}
      </div>

      <Button
        size="sm"
        variant="outline"
        onClick={onRefresh}
        disabled={loading}
      >
        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  );
};

export default PanelAssignmentHeader;
