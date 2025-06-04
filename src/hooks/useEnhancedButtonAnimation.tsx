
import { useState, useCallback } from 'react';

export const useEnhancedButtonAnimation = () => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [animationType, setAnimationType] = useState<'success' | 'error' | 'loading' | null>(null);

  const startAnimation = useCallback((type: 'success' | 'error' | 'loading' = 'success') => {
    setIsAnimating(true);
    setIsPressed(true);
    setAnimationType(type);
    
    // Reset animation baseado no tipo
    const duration = type === 'loading' ? 2000 : 600;
    setTimeout(() => {
      setIsAnimating(false);
      setAnimationType(null);
    }, duration);
    
    // Reset pressed state
    setTimeout(() => {
      setIsPressed(false);
    }, duration + 200);
  }, []);

  const resetAnimation = useCallback(() => {
    setIsAnimating(false);
    setIsPressed(false);
    setAnimationType(null);
  }, []);

  return {
    isAnimating,
    isPressed,
    animationType,
    startAnimation,
    resetAnimation
  };
};
