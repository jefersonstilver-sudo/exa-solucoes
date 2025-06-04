
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
      
      {/* Indicador visual adicional quando há itens */}
      {cartItemsCount > 0 && (
        <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#00FFAB] rounded-full animate-pulse" />
      )}
    </div>
  );
};

export default CartButton;
