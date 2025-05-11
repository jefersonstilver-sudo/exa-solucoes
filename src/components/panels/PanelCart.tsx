
import React, { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Panel } from '@/types/panel';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import CartContent from './cart/CartContent';
import CartActions from './cart/CartActions';
import MobileCart from './cart/MobileCart';
import useCartPriceCalculator from './cart/PriceCalculator';

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
  const [animateCart, setAnimateCart] = useState(false);
  const { toast } = useToast();
  const { calculatePrice, formatCurrency } = useCartPriceCalculator();
  
  // Calculate total price of all items
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + calculatePrice(item.panel, item.duration);
    }, 0);
  };
  
  // Calculate original price without discounts
  const calculateOriginalTotal = () => {
    return cartItems.reduce((total, item) => {
      const basePrice = 100; // Base daily rate
      const locationFactor = item.panel.buildings?.bairro === 'Vila A' ? 1.5 : 
                            item.panel.buildings?.bairro === 'Centro' ? 1.3 : 1;
      return total + (basePrice * locationFactor * item.duration);
    }, 0);
  };
  
  // Calculate discount amount
  const calculateDiscount = () => {
    const original = calculateOriginalTotal();
    const discounted = calculateTotal();
    return original - discounted;
  };

  // Trigger cart bubble animation when items are added
  useEffect(() => {
    if (cartItems.length > 0) {
      setAnimateCart(true);
      setTimeout(() => setAnimateCart(false), 600);
    }
  }, [cartItems.length]);

  // Handle checkout simulation
  const handleCheckout = () => {
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      onClear();
      toast({
        title: "Compra finalizada com sucesso!",
        description: "Você receberá um email com os detalhes do seu pedido.",
      });
    }, 1500);
  };

  // Render the desktop cart
  return (
    <>
      {/* Mobile Cart */}
      <MobileCart 
        cartItems={cartItems}
        onRemove={onRemove}
        onClear={onClear}
        onChangeDuration={onChangeDuration}
        animateCart={animateCart}
        isSubmitting={isSubmitting}
        handleCheckout={handleCheckout}
        calculatePrice={calculatePrice}
        formatCurrency={formatCurrency}
        calculateOriginalTotal={calculateOriginalTotal}
        calculateDiscount={calculateDiscount}
        calculateTotal={calculateTotal}
      />
      
      {/* Desktop Cart */}
      <Card className="sticky top-4 hidden lg:block">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <ShoppingCart className="mr-2 h-5 w-5 text-indexa-purple" />
              Seu Carrinho
            </span>
            {cartItems.length > 0 && (
              <Badge variant="outline" className={`ml-2 border-indexa-purple text-indexa-purple ${animateCart ? 'animate-cart-bubble' : ''}`}>
                {cartItems.length} {cartItems.length === 1 ? 'item' : 'itens'}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <CartContent 
            cartItems={cartItems}
            onRemove={onRemove}
            onChangeDuration={onChangeDuration}
            calculatePrice={calculatePrice}
            formatCurrency={formatCurrency}
            calculateOriginalTotal={calculateOriginalTotal}
            calculateDiscount={calculateDiscount}
            calculateTotal={calculateTotal}
          />
        </CardContent>
        {cartItems.length > 0 && (
          <CardFooter className="flex-col space-y-2">
            <CartActions 
              onCheckout={handleCheckout}
              onClear={onClear}
              isSubmitting={isSubmitting}
            />
          </CardFooter>
        )}
      </Card>
    </>
  );
};

export default PanelCart;
