
import React from 'react';
import { useNavigate } from 'react-router-dom';
import ModernCartIcon from '@/components/cart/ModernCartIcon';

interface CartButtonProps {
  cartItemsCount: number;
  isAnimating?: boolean;
}

const CartButton: React.FC<CartButtonProps> = ({ 
  cartItemsCount, 
  isAnimating = false 
}) => {
  const navigate = useNavigate();

  const handleCartClick = () => {
    navigate('/paineis-digitais/loja');
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
