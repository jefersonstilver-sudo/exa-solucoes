
import React from 'react';
import ModernCartIcon from '@/components/cart/ModernCartIcon';
import { useCart } from '@/contexts/CartContext';

const CartButton: React.FC = () => {
  const { cartItems, cartAnimation, toggleCart } = useCart();
  
  const handleCartClick = () => {
    console.log('🛒 [CartButton] Clique no carrinho detectado');
    console.log('🛒 [CartButton] cartItems.length:', cartItems.length);
    
    toggleCart();
  };

  return (
    <div className="relative">
      <ModernCartIcon
        itemCount={cartItems.length}
        isAnimating={cartAnimation}
        onClick={handleCartClick}
        variant="header"
      />
    </div>
  );
};

export default CartButton;
