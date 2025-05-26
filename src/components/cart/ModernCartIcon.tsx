
import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ModernCartIconProps {
  itemCount: number;
  isAnimating?: boolean;
  onClick?: () => void;
  variant?: 'header' | 'floating';
  className?: string;
}

const ModernCartIcon: React.FC<ModernCartIconProps> = ({
  itemCount,
  isAnimating = false,
  onClick,
  variant = 'header',
  className = ''
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🛒 ModernCartIcon: Clique detectado');
    console.log('🛒 ModernCartIcon: itemCount:', itemCount);
    console.log('🛒 ModernCartIcon: onClick function:', !!onClick);
    
    if (onClick) {
      console.log('🛒 ModernCartIcon: Executando onClick');
      onClick();
    } else {
      console.warn('🛒 ModernCartIcon: onClick não fornecido');
    }
  };

  const baseClasses = variant === 'header' 
    ? "relative p-2 text-white hover:text-[#00FFAB] transition-colors" 
    : "relative p-3 bg-white shadow-lg rounded-full text-[#3C1361] hover:bg-gray-50";

  return (
    <motion.div
      animate={isAnimating ? { scale: [1, 1.2, 1] } : {}}
      transition={{ duration: 0.3 }}
      className={`${baseClasses} ${className}`}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClick}
        className="relative p-0 h-auto w-auto bg-transparent hover:bg-transparent"
      >
        <ShoppingCart className="h-6 w-6" />
        
        {/* Badge com contador */}
        {itemCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -right-2 bg-[#00FFAB] text-[#3C1361] text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white"
          >
            {itemCount > 99 ? '99+' : itemCount}
          </motion.div>
        )}
      </Button>
    </motion.div>
  );
};

export default ModernCartIcon;
