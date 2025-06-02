
import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface BuildingStoreGridStatusProps {
  selectedLocation: { lat: number, lng: number } | null;
  buildingsCount: number;
}

const BuildingStoreGridStatus: React.FC<BuildingStoreGridStatusProps> = ({ 
  selectedLocation, 
  buildingsCount 
}) => {
  const isMobile = useIsMobile();

  if (!selectedLocation) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl ${
        isMobile ? 'p-3 mx-2' : 'p-4'
      }`}
    >
      <div className="flex items-center">
        <Sparkles className="h-5 w-5 text-green-600 mr-3" />
        <span className={`text-green-800 font-medium ${isMobile ? 'text-sm' : ''}`}>
          Exibindo {buildingsCount} prédio{buildingsCount !== 1 ? 's' : ''} próximo{buildingsCount !== 1 ? 's' : ''} à sua busca
        </span>
      </div>
    </motion.div>
  );
};

export default BuildingStoreGridStatus;
