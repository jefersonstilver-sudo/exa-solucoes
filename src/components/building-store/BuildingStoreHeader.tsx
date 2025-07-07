
import React from 'react';
import useBuildingStore from '@/hooks/useBuildingStore';

interface BuildingStoreHeaderProps {
  title?: string;
  subtitle?: string;
}

const BuildingStoreHeader: React.FC<BuildingStoreHeaderProps> = () => {
  const { buildings, isLoading } = useBuildingStore();

  return (
    <div className="animate-fade-in flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div className="text-center sm:text-left">
        
      </div>
    </div>
  );
};

export default BuildingStoreHeader;
