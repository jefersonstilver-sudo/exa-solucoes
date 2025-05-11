
import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { motion } from 'framer-motion';
import { Panel } from '@/types/panel';
import { CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import CartContent from './CartContent';
import CartActions from './CartActions';

interface MobileCartProps {
  cartItems: {panel: Panel, duration: number}[];
  onRemove: (panelId: string) => void; 
  onClear: () => void;
  onChangeDuration: (panelId: string, duration: number) => void;
  animateCart: boolean;
  isSubmitting: boolean;
  handleCheckout: () => void;
  calculatePrice: (panel: Panel, duration: number) => number;
  formatCurrency: (value: number) => string;
  calculateOriginalTotal: () => number;
  calculateDiscount: () => number;
  calculateTotal: () => number;
}

const MobileCart: React.FC<MobileCartProps> = ({
  cartItems,
  onRemove,
  onClear,
  onChangeDuration,
  animateCart,
  isSubmitting,
  handleCheckout,
  calculatePrice,
  formatCurrency,
  calculateOriginalTotal,
  calculateDiscount,
  calculateTotal
}) => {
  return (
    <div className="lg:hidden fixed bottom-4 right-4 z-30">
      <Drawer>
        <DrawerTrigger asChild>
          <motion.button
            className="rounded-full h-14 w-14 shadow-lg bg-indexa-purple text-white hover:bg-indexa-mint hover:text-gray-800 transition-all duration-200 relative flex items-center justify-center"
            animate={animateCart ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.6 }}
          >
            <ShoppingCart className="h-6 w-6" />
            {cartItems.length > 0 && (
              <Badge className="absolute -top-2 -right-2 bg-indexa-mint text-gray-800 border-2 border-white">
                {cartItems.length}
              </Badge>
            )}
          </motion.button>
        </DrawerTrigger>
        <DrawerContent>
          <div className="p-4 max-h-[80vh] overflow-y-auto">
            <CardHeader className="px-0 pt-0 pb-3">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <ShoppingCart className="mr-2 h-5 w-5 text-indexa-purple" />
                  Seu Carrinho
                </span>
                {cartItems.length > 0 && (
                  <Badge variant="outline" className="ml-2 border-indexa-purple text-indexa-purple">
                    {cartItems.length} {cartItems.length === 1 ? 'item' : 'itens'}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
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
              <CardFooter className="flex-col space-y-2 px-0">
                <CartActions 
                  onCheckout={handleCheckout}
                  onClear={onClear}
                  isSubmitting={isSubmitting}
                />
              </CardFooter>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default MobileCart;
