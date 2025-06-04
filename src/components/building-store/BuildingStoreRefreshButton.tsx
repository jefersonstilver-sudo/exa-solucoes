
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import useBuildingStore from '@/hooks/useBuildingStore';

interface BuildingStoreRefreshButtonProps {
  variant?: 'default' | 'secondary' | 'outline';
  size?: 'default' | 'sm' | 'lg';
  showText?: boolean;
}

const BuildingStoreRefreshButton: React.FC<BuildingStoreRefreshButtonProps> = ({
  variant = 'outline',
  size = 'sm',
  showText = false // Alterado para false para ocultar o texto por padrão
}) => {
  const { refreshBuildings, isLoading } = useBuildingStore();

  const handleRefresh = async () => {
    console.log('🔄 [REFRESH BUTTON] Usuário clicou em refresh');
    await refreshBuildings();
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Button
        onClick={handleRefresh}
        disabled={isLoading}
        variant={variant}
        size={size}
        className="flex items-center gap-2"
      >
        <motion.div
          animate={isLoading ? { rotate: 360 } : { rotate: 0 }}
          transition={{
            duration: 1,
            repeat: isLoading ? Infinity : 0,
            ease: "linear"
          }}
        >
          <RefreshCw className="h-4 w-4" />
        </motion.div>
        {showText && (
          <span className="hidden sm:inline">
            {isLoading ? 'Atualizando...' : 'Atualizar'}
          </span>
        )}
      </Button>
    </motion.div>
  );
};

export default BuildingStoreRefreshButton;
