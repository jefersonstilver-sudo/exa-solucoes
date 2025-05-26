
import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface ModernCartIconProps {
  itemCount: number;
  isAnimating?: boolean;
  onClick: () => void;
  variant?: 'header' | 'floating';
}

const ModernCartIcon: React.FC<ModernCartIconProps> = ({ 
  itemCount, 
  isAnimating = false, 
  onClick,
  variant = 'header'
}) => {
  const isFloating = variant === 'floating';
  
  return (
    <motion.div
      className="relative"
      animate={isAnimating ? { 
        scale: [1, 1.1, 1],
        rotate: [0, -5, 5, 0]
      } : {}}
      transition={{ duration: 0.6, ease: "easeInOut" }}
    >
      <Button
        variant={isFloating ? "default" : "ghost"}
        size="icon"
        className={`
          relative transition-all duration-300 group
          ${isFloating 
            ? 'bg-[#3C1361] hover:bg-[#3C1361]/90 text-white shadow-lg rounded-full h-14 w-14' 
            : 'text-white hover:bg-white/20 rounded-full h-10 w-10 md:h-12 md:w-12'
          }
        `}
        onClick={onClick}
        aria-label={`Carrinho com ${itemCount} ${itemCount === 1 ? 'item' : 'itens'}`}
      >
        <motion.div
          animate={itemCount > 0 ? { 
            scale: [1, 1.05, 1],
          } : {}}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        >
          <ShoppingCart className={`
            ${isFloating ? 'h-6 w-6' : 'h-4 w-4 md:h-6 md:w-6'}
            transition-transform duration-200 group-hover:scale-110
          `} />
        </motion.div>
        
        {/* Badge do contador */}
        <AnimatePresence>
          {itemCount > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className={`
                absolute flex items-center justify-center
                bg-gradient-to-r from-[#00D4AA] to-[#00B894]
                text-[#3C1361] text-xs font-bold rounded-full
                border-2 border-white shadow-lg
                ${isFloating 
                  ? '-top-2 -right-2 h-7 w-7 min-w-[28px]' 
                  : '-top-1 -right-1 h-5 w-5 md:h-6 md:w-6 min-w-[20px] md:min-w-[24px]'
                }
              `}
            >
              <motion.span
                key={itemCount}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                {itemCount > 99 ? '99+' : itemCount}
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Pulso quando há itens */}
        {itemCount > 0 && (
          <motion.div
            className={`
              absolute rounded-full bg-[#00D4AA]/30
              ${isFloating ? 'h-14 w-14' : 'h-10 w-10 md:h-12 md:w-12'}
            `}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 0, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
      </Button>
    </motion.div>
  );
};

export default ModernCartIcon;
