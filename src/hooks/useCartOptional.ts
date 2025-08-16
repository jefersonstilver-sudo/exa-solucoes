import { useContext } from 'react';
import { SimpleCartContext } from '@/contexts/SimpleCartContext';

// Safe cart hook that returns null when no cart provider is available
export const useCartOptional = () => {
  try {
    const context = useContext(SimpleCartContext);
    if (context) return context;

    // Fallback: try global cart (for components rendered outside the main React tree)
    const globalCart = (window as any).__simpleCart;
    if (globalCart) {
      console.log('Cart context (global):', globalCart);
      return globalCart;
    }

    return null;
  } catch (error) {
    console.log('Cart context error:', error); // Debug log
    // Return null if context is not available
    return null;
  }
};