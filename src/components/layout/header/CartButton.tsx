
import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CartButtonProps {
  cartItemsCount: number;
  isAnimating?: boolean;
  onToggleCart?: () => void;
}

const CartButton: React.FC<CartButtonProps> = ({ 
  cartItemsCount, 
  isAnimating = false,
  onToggleCart
}) => {
  const handleCartClick = () => {
    if (onToggleCart) {
      onToggleCart();
    }
  };

  return (
    <button
      onClick={handleCartClick}
      className={`relative p-2 rounded-lg bg-white shadow-md hover:shadow-lg transition-all duration-200 button-hover ${
        isAnimating ? 'cart-pulse' : ''
      }`}
      aria-label={`Carrinho com ${cartItemsCount} item${cartItemsCount !== 1 ? 's' : ''}`}
    >
      <ShoppingCart className="h-6 w-6 text-[#3C1361]" />
      
      {cartItemsCount > 0 && (
        <Badge 
          className="absolute -top-2 -right-2 bg-[#00FFAB] text-[#3C1361] text-xs font-bold min-w-[20px] h-5 flex items-center justify-center"
        >
          {cartItemsCount > 99 ? '99+' : cartItemsCount}
        </Badge>
      )}
    </button>
  );
};

export default CartButton;
