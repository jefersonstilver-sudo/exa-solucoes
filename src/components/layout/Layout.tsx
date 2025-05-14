
import React, { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import { Panel } from '@/types/panel';
import { useNavigate } from 'react-router-dom';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import PanelCart from '@/components/panels/PanelCart';

interface LayoutProps {
  children: React.ReactNode;
  cartItems?: {panel: Panel, duration: number}[];
  onRemoveFromCart?: (panelId: string) => void;
  onClearCart?: () => void;
  onChangeDuration?: (panelId: string, duration: number) => void;
  onProceedToCheckout?: () => void;
  useGradientBackground?: boolean;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  cartItems = [],
  onRemoveFromCart = () => {},
  onClearCart = () => {},
  onChangeDuration = () => {},
  onProceedToCheckout = () => {},
  useGradientBackground = false
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  return (
    <div className={`min-h-screen flex flex-col ${useGradientBackground ? 'bg-gradient-to-b from-gray-50 to-gray-100' : ''}`}>
      <Header 
        cartItems={cartItems}
        cartItemCount={cartItems?.length || 0}
        setDrawerOpen={setIsDrawerOpen}
        onRemoveFromCart={onRemoveFromCart}
        onClearCart={onClearCart}
        onChangeDuration={onChangeDuration}
        onProceedToCheckout={onProceedToCheckout}
      />
      
      <main className="flex-grow">
        {children}
      </main>

      <Footer />
      
      {/* Shopping Cart Drawer */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="h-[85vh]">
          <PanelCart 
            cartItems={cartItems} 
            onRemove={onRemoveFromCart}
            onClear={onClearCart}
            onChangeDuration={onChangeDuration}
            onProceedToCheckout={onProceedToCheckout}
          />
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default Layout;
