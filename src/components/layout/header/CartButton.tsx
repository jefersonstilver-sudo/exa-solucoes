
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
    console.log('🛒 CartButton: Clique no carrinho detectado');
    if (onToggleCart) {
      console.log('🛒 CartButton: Chamando função toggleCart');
      onToggleCart();
    } else {
      console.error('🛒 CartButton: ERRO - onToggleCart não foi fornecida!');
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
