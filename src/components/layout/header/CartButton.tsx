
import React, { useEffect } from 'react';
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
  console.log('🛒 [CartButton] === RENDERIZANDO ===');
  console.log('🛒 [CartButton] Props:', { cartItemsCount, isAnimating, hasToggleCart: !!onToggleCart });

  // Log state changes
  useEffect(() => {
    console.log('🔄 [CartButton] Estado mudou:', { cartItemsCount, isAnimating });
  }, [cartItemsCount, isAnimating]);

  const handleCartClick = () => {
    console.log('🛒 [CartButton] === CLIQUE DETECTADO ===');
    console.log('🛒 [CartButton] Current count:', cartItemsCount);
    console.log('🛒 [CartButton] onToggleCart available:', !!onToggleCart);
    
    if (onToggleCart) {
      console.log('🛒 [CartButton] Executando toggleCart');
      onToggleCart();
    } else {
      console.error('🛒 [CartButton] ❌ ERRO - onToggleCart não fornecida!');
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
      
      {/* Enhanced visual indicators */}
      {cartItemsCount > 0 && (
        <>
          {/* Pulse indicator */}
          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#00FFAB] rounded-full animate-pulse" />
          
          {/* Glow effect when animating */}
          {isAnimating && (
            <div className="absolute inset-0 bg-[#00FFAB]/20 rounded-full animate-ping" />
          )}
        </>
      )}
      
      {/* Enhanced debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute -top-10 -left-6 bg-black text-white text-xs px-2 py-1 rounded opacity-75 pointer-events-none">
          Count: {cartItemsCount} | Anim: {isAnimating ? 'Y' : 'N'}
        </div>
      )}
    </div>
  );
};

export default CartButton;
