import { useContext } from 'react';
import { SimpleCartContext } from '@/contexts/SimpleCartContext';

// Safe cart hook that returns null when no cart provider is available
export const useCartOptional = () => {
  try {
    const context = useContext(SimpleCartContext);
    return context || null;
  } catch {
    // Return null if context is not available
    return null;
  }
};