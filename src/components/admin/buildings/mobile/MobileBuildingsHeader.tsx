import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';

interface MobileBuildingsHeaderProps {
  loading: boolean;
  onRefresh: () => void;
  onNewBuilding: () => void;
}

const MobileBuildingsHeader: React.FC<MobileBuildingsHeaderProps> = ({
  loading,
  onRefresh,
  onNewBuilding
}) => {
  return (
    <div className="flex items-center justify-between py-2">
      <h1 className="text-lg font-semibold text-foreground">Prédios</h1>
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onRefresh} 
          disabled={loading}
          className="h-9 w-9"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
        <Button 
          size="sm"
          className="bg-[#9C1E1E] hover:bg-[#7A1818] text-white h-9 px-3"
          onClick={onNewBuilding}
        >
          <Plus className="h-4 w-4 mr-1" />
          Novo
        </Button>
      </div>
    </div>
  );
};

export default MobileBuildingsHeader;
