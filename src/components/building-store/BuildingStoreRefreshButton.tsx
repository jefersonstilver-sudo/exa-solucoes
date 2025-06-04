
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import useBuildingStore from '@/hooks/useBuildingStore';

interface BuildingStoreRefreshButtonProps {
  variant?: 'default' | 'secondary' | 'outline';
  size?: 'default' | 'sm' | 'lg';
  showText?: boolean;
}

const BuildingStoreRefreshButton: React.FC<BuildingStoreRefreshButtonProps> = ({
  variant = 'outline',
  size = 'sm',
  showText = false
}) => {
  const { refreshBuildings, isLoading } = useBuildingStore();

  const handleRefresh = async () => {
    await refreshBuildings();
  };

  return (
    <div className="hover-scale">
      <Button
        onClick={handleRefresh}
        disabled={isLoading}
        variant={variant}
        size={size}
        className="flex items-center gap-2"
      >
        <div className={isLoading ? 'animate-spin' : ''}>
          <RefreshCw className="h-4 w-4" />
        </div>
        {showText && (
          <span className="hidden sm:inline">
            {isLoading ? 'Atualizando...' : 'Atualizar'}
          </span>
        )}
      </Button>
    </div>
  );
};

export default BuildingStoreRefreshButton;
