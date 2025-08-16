import { useContext } from 'react';
import { SimpleCartContext } from '@/contexts/SimpleCartContext';

// Safe cart hook that returns null when no cart provider is available
export const useCartOptional = () => {
  try {
    const context = useContext(SimpleCartContext);
    console.log('Cart context:', context); // Debug log
    return context || null;
  } catch (error) {
    console.log('Cart context error:', error); // Debug log
    // Return null if context is not available
    return null;
  }
};