
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
  console.log('🛒 [CartButton] === RENDERIZANDO CART BUTTON ===');
  console.log('🛒 [CartButton] cartItemsCount:', cartItemsCount);
  console.log('🛒 [CartButton] isAnimating:', isAnimating);
  console.log('🛒 [CartButton] onToggleCart function provided:', !!onToggleCart);

  const handleCartClick = () => {
    console.log('🛒 [CartButton] === CLIQUE NO CARRINHO DETECTADO ===');
    console.log('🛒 [CartButton] Current cartItemsCount:', cartItemsCount);
    console.log('🛒 [CartButton] onToggleCart function:', !!onToggleCart);
    
    if (onToggleCart) {
      console.log('🛒 [CartButton] Chamando função toggleCart');
      onToggleCart();
    } else {
      console.error('🛒 [CartButton] ERRO CRÍTICO - onToggleCart não foi fornecida!');
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
      
      {/* Enhanced visual indicator when has items */}
      {cartItemsCount > 0 && (
        <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#00FFAB] rounded-full animate-pulse" />
      )}
      
      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute -top-8 -left-4 bg-black text-white text-xs px-1 py-0.5 rounded opacity-75 pointer-events-none">
          {cartItemsCount}
        </div>
      )}
    </div>
  );
};

export default CartButton;
