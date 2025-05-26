
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CartButtonProps {
  cartItemsCount: number;
}

const CartButton: React.FC<CartButtonProps> = ({ cartItemsCount }) => {
  const navigate = useNavigate();
  const [isAnimating, setIsAnimating] = useState(false);
  const [previousCount, setPreviousCount] = useState(cartItemsCount);

  const handleCartClick = () => {
    navigate('/paineis-digitais/loja');
  };

  // Animar quando o contador mudar
  useEffect(() => {
    if (cartItemsCount > previousCount) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 800);
    }
    setPreviousCount(cartItemsCount);
  }, [cartItemsCount, previousCount]);

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative text-white hover:bg-white/20 rounded-full h-10 w-10 md:h-12 md:w-12 transition-all duration-200"
      onClick={handleCartClick}
      aria-label={`Carrinho com ${cartItemsCount} itens`}
    >
      <motion.div
        animate={isAnimating ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] } : {}}
        transition={{ duration: 0.6 }}
      >
        <ShoppingCart className="h-4 w-4 md:h-6 md:w-6" />
      </motion.div>
      
      <AnimatePresence>
        {cartItemsCount > 0 && (
          <motion.span
            key={cartItemsCount}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: 1, 
              opacity: 1,
              ...(isAnimating ? {
                scale: [1, 1.3, 1],
                backgroundColor: ['#10B981', '#EF4444', '#10B981']
              } : {})
            }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ 
              duration: isAnimating ? 0.8 : 0.3,
              type: "spring",
              stiffness: 300,
              damping: 20
            }}
            className="absolute -top-1 -right-1 bg-indexa-mint text-indexa-purple text-xs font-bold rounded-full h-5 w-5 md:h-6 md:w-6 flex items-center justify-center min-w-[20px] md:min-w-[24px] shadow-lg"
          >
            {cartItemsCount > 99 ? '99+' : cartItemsCount}
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
};

export default CartButton;
