
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
  
  return (
    <SimpleCartContext.Provider value={cartState}>
      {children}
    </SimpleCartContext.Provider>
  );
};
