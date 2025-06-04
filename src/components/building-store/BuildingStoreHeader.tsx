
import React from 'react';
import { motion } from 'framer-motion';
import BuildingStoreRefreshButton from './BuildingStoreRefreshButton';
import useBuildingStore from '@/hooks/useBuildingStore';

interface BuildingStoreHeaderProps {
  title?: string;
  subtitle?: string;
}

const BuildingStoreHeader: React.FC<BuildingStoreHeaderProps> = ({
  title = "Escolha seu Espaço",
  subtitle
}) => {
  const { buildings, isLoading } = useBuildingStore();

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
    >
      <div className="text-center sm:text-left">
        <h1 className="text-3xl md:text-4xl font-bold text-[#3C1361] mb-2">
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg text-gray-600">
            {subtitle}
          </p>
        )}
        <p className="text-sm text-gray-500 mt-1">
          {isLoading ? 'Carregando...' : `${buildings.length} prédio${buildings.length !== 1 ? 's' : ''} disponível${buildings.length !== 1 ? 'eis' : ''}`}
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        <BuildingStoreRefreshButton />
      </div>
    </motion.div>
  );
};

export default BuildingStoreHeader;
