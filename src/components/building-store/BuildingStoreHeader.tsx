
import React from 'react';
import { motion } from 'framer-motion';
import useBuildingStore from '@/hooks/useBuildingStore';

interface BuildingStoreHeaderProps {
  title?: string;
  subtitle?: string;
}

const BuildingStoreHeader: React.FC<BuildingStoreHeaderProps> = () => {
  const { buildings, isLoading } = useBuildingStore();

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
    >
      <div className="text-center sm:text-left">
        
      </div>
    </motion.div>
  );
};

export default BuildingStoreHeader;
