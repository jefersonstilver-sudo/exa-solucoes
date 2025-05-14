
import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { Panel } from '@/types/panel';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useUserSession } from '@/hooks/useUserSession';
import { AnimatePresence, motion } from 'framer-motion';
import { formatCurrency } from '@/utils/formatters';

// Import components
import CartHeader from '@/components/cart/CartHeader';
import CartUserStatus from '@/components/cart/CartUserStatus';
import CartItem from '@/components/cart/CartItem';
import CartSummary from '@/components/cart/CartSummary';
import EmptyCart from '@/components/cart/EmptyCart';
import { useCouponValidator } from '@/hooks/useCouponValidator';

interface PanelCartProps {
  cartItems: {panel: Panel, duration: number}[];
  onRemove: (panelId: string) => void;
  onClear: () => void;
  onChangeDuration: (panelId: string, duration: number) => void;
}

const PanelCart: React.FC<PanelCartProps> = ({ 
  cartItems, 
  onRemove, 
  onClear, 
  onChangeDuration 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useUserSession();
  const { couponDiscount, couponValid } = useCouponValidator();
  
  // Calculate price for a single panel based on duration
  const calculatePrice = (panel: Panel, days: number) => {
    // Base monthly price
    let pricePerMonth = 280; // Default price for 1 month
    
    // Add slight variation based on panel ID
    const priceVariation = parseInt(panel.id.slice(-2), 16) % 40; // 0-39 variation
    pricePerMonth += priceVariation;
    
    // Calculate total price based on months
    const months = Math.round(days / 30);
    
    // Apply discount based on months
    if (months >= 6) {
      return pricePerMonth * months * 0.85; // 15% discount
    } else if (months >= 3) {
      return pricePerMonth * months * 0.9; // 10% discount
    } else if (months >= 2) {
      return pricePerMonth * months * 0.95; // 5% discount
    }
    
    return pricePerMonth * months;
  };
  
  // Calculate total price for all items in cart
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + calculatePrice(item.panel, item.duration);
    }, 0);
  };

  // Calculate potential quantity discount amount
  const calculateQuantityDiscount = () => {
    if (cartItems.length >= 3) {
      return calculateTotal() * 0.05; // 5% discount for 3+ items
    }
    return 0;
  };

  // Calculate coupon discount amount
  const calculateCouponDiscount = () => {
    if (couponValid && couponDiscount > 0) {
      const afterQuantityDiscount = calculateTotal() - calculateQuantityDiscount();
      return afterQuantityDiscount * (couponDiscount / 100);
    }
    return 0;
  };

  // Calculate final price after all discounts
  const calculateFinalPrice = () => {
    return calculateTotal() - calculateQuantityDiscount() - calculateCouponDiscount();
  };
  
  const handleCheckout = () => {
    console.log("Checkout iniciado, usuário logado:", isLoggedIn);
    
    if (cartItems.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione painéis ao seu carrinho para finalizar a compra",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (!isLoggedIn) {
        toast({
          title: "Login necessário",
          description: "Faça login para continuar com a compra",
        });
        
        // Salvar URL de retorno para voltar após o login
        const returnUrl = '/checkout';
        navigate(`/login?redirect=${encodeURIComponent(returnUrl)}`);
      } else {
        // CORREÇÃO IMPORTANTE: Garante navegação direta para checkout mesmo estando logado
        console.log("Usuário já logado, redirecionando para /checkout");
        setTimeout(() => {
          navigate('/checkout');
        }, 100);
      }
    } catch (error) {
      console.error("Erro ao processar checkout:", error);
      toast({
        title: "Erro ao processar",
        description: "Ocorreu um erro ao finalizar a compra. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      className="flex flex-col h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <CartHeader itemCount={cartItems.length} onClear={onClear} />
      
      <div className="flex-grow overflow-auto pb-4 pt-1">
        <AnimatePresence mode="wait">
          {cartItems.length > 0 ? (
            <motion.div 
              key="cart-items"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <CartUserStatus isLoggedIn={isLoggedIn} user={user} />
              
              {/* Cart items */}
              <div className="space-y-1 px-5 sm:px-6">
                {cartItems.map((item) => (
                  <CartItem 
                    key={item.panel.id}
                    item={item}
                    onRemove={onRemove}
                    onChangeDuration={onChangeDuration}
                    calculatePrice={calculatePrice}
                  />
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty-cart"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <EmptyCart />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {cartItems.length > 0 && (
        <CartSummary 
          subtotal={calculateTotal()}
          discount={calculateQuantityDiscount()}
          total={calculateFinalPrice()}
          onCheckout={handleCheckout}
          isSubmitting={isSubmitting}
          isEmpty={cartItems.length === 0}
        />
      )}
    </motion.div>
  );
};

export default PanelCart;
