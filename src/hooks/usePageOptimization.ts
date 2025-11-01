import { useState, useEffect } from 'react';
import { useIsMobile } from './use-mobile';

interface PageOptimizationConfig {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  shouldReduceMotion: boolean;
  animationDuration: number;
  enableHeavyEffects: boolean;
  lazyLoadThreshold: number;
}

export const usePageOptimization = (): PageOptimizationConfig => {
  const isMobile = useIsMobile();
  const [isTablet, setIsTablet] = useState(false);
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false);

  useEffect(() => {
    // Detectar tablet
    const checkTablet = () => {
      const width = window.innerWidth;
      setIsTablet(width >= 768 && width < 1024);
    };

    // Detectar preferência de movimento reduzido
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setShouldReduceMotion(motionQuery.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setShouldReduceMotion(e.matches);
    };

    checkTablet();
    window.addEventListener('resize', checkTablet);
    motionQuery.addEventListener('change', handleMotionChange);

    return () => {
      window.removeEventListener('resize', checkTablet);
      motionQuery.removeEventListener('change', handleMotionChange);
    };
  }, []);

  const isDesktop = !isMobile && !isTablet;

  return {
    isMobile,
    isTablet,
    isDesktop,
    shouldReduceMotion,
    // Animações mais rápidas em mobile
    animationDuration: shouldReduceMotion ? 0 : isMobile ? 200 : 300,
    // Desabilitar efeitos pesados em mobile
    enableHeavyEffects: !isMobile && !shouldReduceMotion,
    // Threshold menor para lazy load em mobile
    lazyLoadThreshold: isMobile ? 0.05 : 0.1,
  };
};
