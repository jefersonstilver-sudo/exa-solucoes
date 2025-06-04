
import { useState, useCallback } from 'react';

export const useButtonAnimation = () => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const startAnimation = useCallback(() => {
    setIsAnimating(true);
    setIsPressed(true);
    
    // Reset animation após 600ms
    setTimeout(() => {
      setIsAnimating(false);
    }, 600);
    
    // Reset pressed state após 1200ms para manter feedback visual
    setTimeout(() => {
      setIsPressed(false);
    }, 1200);
  }, []);

  const resetAnimation = useCallback(() => {
    setIsAnimating(false);
    setIsPressed(false);
  }, []);

  return {
    isAnimating,
    isPressed,
    startAnimation,
    resetAnimation
  };
};
