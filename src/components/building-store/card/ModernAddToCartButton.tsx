
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Check, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { Panel } from '@/types/panel';

interface ModernAddToCartButtonProps {
  panel: Panel;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
}

const ModernAddToCartButton: React.FC<ModernAddToCartButtonProps> = ({ 
  panel, 
  className = '',
  size = 'default'
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const { addToCart, isItemInCart, initialLoadDone } = useCart();
  
  // Verificar se está no carrinho
  const inCart = initialLoadDone ? isItemInCart(panel.id) : false;

  const handleAddToCart = async () => {
    if (inCart || isAdding) return;
    
    try {
      console.log('🛒 [ModernAddToCartButton] Adicionando ao carrinho:', panel.id);
      
      // Estado otimista
      setIsAdding(true);
      
      // Adicionar ao carrinho
      addToCart(panel, 30);
      
      // Reset do loading após feedback visual
      setTimeout(() => {
        setIsAdding(false);
      }, 1000);
      
    } catch (error) {
      console.error('🛒 [ModernAddToCartButton] Erro:', error);
      setIsAdding(false);
    }
  };

  // Determinar estado do botão
  const getButtonState = () => {
    if (isAdding) return 'loading';
    if (inCart) return 'added';
    return 'normal';
  };

  const buttonState = getButtonState();

  // Styling baseado no estado
  const getButtonStyles = () => {
    const sizeStyles = {
      sm: 'px-4 py-2 text-sm',
      default: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg'
    };

    const baseStyles = `font-semibold transition-all duration-300 rounded-xl ${sizeStyles[size]}`;

    switch (buttonState) {
      case 'loading':
        return `${baseStyles} bg-[#3C1361]/80 text-white cursor-wait`;
      case 'added':
        return `${baseStyles} bg-green-500 hover:bg-green-500 text-white cursor-default`;
      default:
        return `${baseStyles} bg-[#3C1361] hover:bg-[#3C1361]/90 text-white hover:scale-105`;
    }
  };

  return (
    <motion.div
      animate={
        buttonState === 'loading' 
          ? { 
              scale: [1, 1.05, 1], 
              backgroundColor: ['#3C1361', '#22c55e', '#3C1361']
            } 
          : { scale: 1 }
      }
      transition={{ 
        duration: buttonState === 'loading' ? 0.8 : 0.2,
        ease: "easeInOut"
      }}
      className="w-full"
    >
      <Button
        onClick={handleAddToCart}
        disabled={buttonState === 'added' || buttonState === 'loading'}
        className={`${getButtonStyles()} ${className} w-full`}
      >
        {buttonState === 'loading' ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Adicionando...
          </>
        ) : buttonState === 'added' ? (
          <>
            <Check className="h-4 w-4 mr-2" />
            Adicionado
          </>
        ) : (
          <>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Adicionar ao Carrinho
          </>
        )}
      </Button>
    </motion.div>
  );
};

export default ModernAddToCartButton;
