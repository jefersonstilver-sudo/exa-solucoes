
import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ModernCartIconProps {
  itemCount: number;
  isAnimating?: boolean;
  onClick?: () => void;
  variant?: 'header' | 'floating' | 'mobile';
  className?: string;
}

const ModernCartIcon: React.FC<ModernCartIconProps> = ({
  itemCount = 0,
  isAnimating = false,
  onClick,
  variant = 'header',
  className = ''
}) => {
  console.log('🛒 [ModernCartIcon] Renderizando:', {
    itemCount,
    isAnimating,
    variant,
    hasOnClick: !!onClick
  });

  const handleClick = () => {
    console.log('🛒 [ModernCartIcon] Clique detectado');
    if (onClick) {
      console.log('🛒 [ModernCartIcon] Executando onClick');
      onClick();
    } else {
      console.error('🛒 [ModernCartIcon] ERRO - onClick não fornecido!');
    }
  };

  // Variant-specific styling
  const getVariantStyles = () => {
    switch (variant) {
      case 'header':
        return {
          button: 'relative p-2 text-white hover:text-[#00FFAB] transition-colors duration-200',
          icon: 'h-6 w-6 text-white', // FORÇAR COR BRANCA
          badge: 'absolute -top-1 -right-1 h-5 w-5 text-xs'
        };
      case 'floating':
        return {
          button: 'relative p-3 bg-indexa-purple text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300',
          icon: 'h-6 w-6 text-white',
          badge: 'absolute -top-2 -right-2 h-6 w-6 text-xs'
        };
      case 'mobile':
        return {
          button: 'relative p-2 text-white hover:text-[#00FFAB] transition-colors duration-200',
          icon: 'h-5 w-5 text-white', // FORÇAR COR BRANCA
          badge: 'absolute -top-1 -right-1 h-4 w-4 text-xs'
        };
      default:
        return {
          button: 'relative p-2 text-white hover:text-[#00FFAB] transition-colors duration-200',
          icon: 'h-6 w-6 text-white', // FORÇAR COR BRANCA
          badge: 'absolute -top-1 -right-1 h-5 w-5 text-xs'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <motion.div
      animate={isAnimating ? { scale: [1, 1.2, 1] } : {}}
      transition={{ duration: 0.6 }}
      className="relative"
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        className={`${styles.button} ${className}`}
        aria-label={`Carrinho de compras${itemCount > 0 ? ` - ${itemCount} ${itemCount === 1 ? 'item' : 'itens'}` : ' - vazio'}`}
      >
        <ShoppingCart className={styles.icon} />
        
        {/* Item count badge with animation */}
        <AnimatePresence>
          {itemCount > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 500, 
                damping: 30 
              }}
              className={styles.badge}
            >
              <Badge 
                className="bg-red-500 hover:bg-red-500 text-white border-0 rounded-full flex items-center justify-center p-0 min-w-0 h-full w-full"
              >
                <span className="font-medium leading-none">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              </Badge>
            </motion.div>
          )}
        </AnimatePresence>
      </Button>
      
      {/* Pulse animation when adding items */}
      {isAnimating && (
        <motion.div
          className="absolute inset-0 rounded-full bg-[#00FFAB] opacity-30"
          initial={{ scale: 1, opacity: 0.3 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 0.6 }}
          style={{ pointerEvents: 'none' }}
        />
      )}
    </motion.div>
  );
};

export default ModernCartIcon;
