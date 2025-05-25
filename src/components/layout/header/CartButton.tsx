
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';

interface CartButtonProps {
  cartItemsCount: number;
}

const CartButton: React.FC<CartButtonProps> = ({ cartItemsCount }) => {
  const navigate = useNavigate();

  const handleCartClick = () => {
    navigate('/paineis-digitais/loja');
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative text-white hover:bg-white/20 rounded-full h-10 w-10 md:h-12 md:w-12 transition-all duration-200"
      onClick={handleCartClick}
      aria-label={`Carrinho com ${cartItemsCount} itens`}
    >
      <ShoppingCart className="h-4 w-4 md:h-6 md:w-6" />
      {cartItemsCount > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 bg-indexa-mint text-indexa-purple text-xs font-bold rounded-full h-5 w-5 md:h-6 md:w-6 flex items-center justify-center min-w-[20px] md:min-w-[24px]"
        >
          {cartItemsCount > 99 ? '99+' : cartItemsCount}
        </motion.span>
      )}
    </Button>
  );
};

export default CartButton;
