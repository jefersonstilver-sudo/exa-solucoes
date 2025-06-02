
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
    console.log('🛒 [CartButton] Clique no carrinho detectado');
    console.log('🛒 [CartButton] cartItemsCount:', cartItemsCount);
    console.log('🛒 [CartButton] onToggleCart function:', !!onToggleCart);
    
    if (onToggleCart) {
      console.log('🛒 [CartButton] Chamando função toggleCart');
      onToggleCart();
    } else {
      console.error('🛒 [CartButton] ERRO - onToggleCart não foi fornecida!');
    }
  };

  return (
    <div className="relative">
      <ModernCartIcon
        itemCount={cartItemsCount}
        isAnimating={isAnimating}
        onClick={handleCartClick}
        variant="header"
      />
      
      {/* Debug: Mostrar estado do carrinho */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute -bottom-8 -right-2 text-xs bg-black text-white px-1 rounded opacity-50">
          {cartItemsCount}
        </div>
      )}
    </div>
  );
};

export default CartButton;
