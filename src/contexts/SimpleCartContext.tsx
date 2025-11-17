
import React, { createContext, useContext, ReactNode } from 'react';
import { useSimpleCart } from '@/hooks/useSimpleCart';

export const SimpleCartContext = createContext<ReturnType<typeof useSimpleCart> | undefined>(undefined);

export const useCart = () => {
  const context = useContext(SimpleCartContext);
  if (!context) {
    throw new Error('useCart must be used within a SimpleCartProvider');
  }
  return context;
};

interface SimpleCartProviderProps {
  children: ReactNode;
}

export const SimpleCartProvider: React.FC<SimpleCartProviderProps> = ({ children }) => {
  const cartState = useSimpleCart();
  
  // Expose cart globally for out-of-tree renders (e.g., Google Maps markers)
  React.useEffect(() => {
    try {
      (window as any).__simpleCart = cartState;
      const ids = cartState.cartItems?.map((i: any) => i?.panel?.id) || [];
      
      console.log("🛒 [SimpleCartContext] Cart updated:", {
        itemCount: cartState.itemCount,
        panelIds: ids,
        timestamp: Date.now()
      });
      
      window.dispatchEvent(new CustomEvent('cart:updated', {
        detail: { itemCount: cartState.itemCount, ids }
      }));
    } catch (error) {
      console.error("❌ [SimpleCartContext] Error updating cart:", error);
    }
  }, [cartState, cartState.cartItems, cartState.itemCount]);
  
  return (
    <SimpleCartContext.Provider value={cartState}>
      {children}
    </SimpleCartContext.Provider>
  );
};
