
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
  const handleCartClick = () => {
    if (onToggleCart) {
      onToggleCart();
    }
  };

  return (
    <ModernCartIcon
      itemCount={cartItemsCount}
      isAnimating={isAnimating}
      onClick={handleCartClick}
      variant="header"
    />
  );
};

export default CartButton;
