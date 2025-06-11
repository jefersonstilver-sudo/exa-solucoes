
import React from 'react';
import ModernCartIcon from '@/components/cart/ModernCartIcon';

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
  return (
    <div className="bg-white shadow-md hover:shadow-lg transition-all duration-200 rounded-lg">
      <ModernCartIcon
        itemCount={cartItemsCount}
        isAnimating={isAnimating}
        onClick={onToggleCart}
        variant="header"
        className="text-[#3C1361] hover:text-[#3C1361]/80"
      />
    </div>
  );
};

export default CartButton;
