
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface FullscreenCloseButtonProps {
  isFullscreen: boolean;
  toggleFullscreen: () => void;
}

const FullscreenCloseButton: React.FC<FullscreenCloseButtonProps> = ({
  isFullscreen,
  toggleFullscreen
}) => {
  if (!isFullscreen) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      className="absolute bottom-4 left-1/2 transform -translate-x-1/2"
    >
      <Button 
        className="bg-[#7C3AED] hover:bg-[#00F894] transition-all hover:scale-105 duration-200"
        onClick={toggleFullscreen}
      >
        Fechar Mapa
      </Button>
    </motion.div>
  );
};

export default FullscreenCloseButton;
